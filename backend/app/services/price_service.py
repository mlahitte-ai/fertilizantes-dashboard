from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, func, text
from datetime import date, datetime
from typing import Optional
import calendar

from app.models.price import Price


async def get_current_prices(db: AsyncSession) -> list:
    """Devuelve el precio más reciente de cada (product, market)."""
    subq = (
        select(Price.product, Price.market, func.max(Price.date).label("max_date"))
        .group_by(Price.product, Price.market)
        .subquery()
    )
    stmt = select(Price).join(
        subq,
        and_(
            Price.product == subq.c.product,
            Price.market == subq.c.market,
            Price.date == subq.c.max_date,
        ),
    )
    result = await db.execute(stmt)
    rows = result.scalars().all()
    return [
        {
            "product": r.product,
            "market": r.market,
            "date": r.date.isoformat(),
            "value": r.value,
            "source": r.source,
        }
        for r in rows
    ]


async def get_price_history(
    db: AsyncSession,
    product: str,
    market: str,
    from_ym: Optional[str],
    to_ym: Optional[str],
) -> list:
    """Serie histórica mensual para (product, market)."""
    filters = [Price.product == product, Price.market == market]

    if from_ym:
        y, m = map(int, from_ym.split("-"))
        filters.append(Price.date >= date(y, m, 1))
    if to_ym:
        y, m = map(int, to_ym.split("-"))
        last_day = calendar.monthrange(y, m)[1]
        filters.append(Price.date <= date(y, m, last_day))

    stmt = select(Price).where(and_(*filters)).order_by(Price.date)
    result = await db.execute(stmt)
    rows = result.scalars().all()
    return [
        {"date": r.date.isoformat(), "value": r.value, "source": r.source}
        for r in rows
    ]


async def upsert_price(
    db: AsyncSession,
    product: str,
    market: str,
    price_date: date,
    value: float,
    source: str,
) -> None:
    """Inserta o actualiza un precio. Usa ON CONFLICT para idempotencia."""
    existing = await db.execute(
        select(Price).where(
            and_(
                Price.product == product,
                Price.market == market,
                Price.date == price_date,
            )
        )
    )
    row = existing.scalar_one_or_none()
    if row:
        row.value = value
        row.source = source
    else:
        db.add(Price(product=product, market=market, date=price_date, value=value, source=source))
    await db.commit()
