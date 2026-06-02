from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from datetime import date, timedelta
from dateutil.relativedelta import relativedelta
import statistics

from app.models.price import Price


async def compute_ratio(
    db: AsyncSession,
    grain: str,
    grain_market: str,
    fert: str,
    fert_market: str,
    months: int,
) -> dict:
    """
    Calcula la serie de ratio = precio_fertilizante / precio_grano
    para los últimos `months` meses. Devuelve serie + estadísticas.
    """
    since = date.today() - relativedelta(months=months)

    grain_stmt = (
        select(Price)
        .where(and_(Price.product == grain, Price.market == grain_market, Price.date >= since))
        .order_by(Price.date)
    )
    fert_stmt = (
        select(Price)
        .where(and_(Price.product == fert, Price.market == fert_market, Price.date >= since))
        .order_by(Price.date)
    )

    grain_rows = (await db.execute(grain_stmt)).scalars().all()
    fert_rows = (await db.execute(fert_stmt)).scalars().all()

    # Indexar por año-mes para poder cruzar series
    def to_month_dict(rows):
        d = {}
        for r in rows:
            key = (r.date.year, r.date.month)
            d[key] = r.value
        return d

    grain_dict = to_month_dict(grain_rows)
    fert_dict = to_month_dict(fert_rows)

    common_keys = sorted(set(grain_dict) & set(fert_dict))
    if not common_keys:
        return {"series": [], "average": None, "std_dev": None, "message": "Sin datos suficientes para el período"}

    series = []
    ratios = []
    for ym in common_keys:
        g = grain_dict[ym]
        f = fert_dict[ym]
        if g and g > 0:
            ratio = round(f / g, 3)
            ratios.append(ratio)
            series.append({
                "year": ym[0],
                "month": ym[1],
                "date": f"{ym[0]}-{ym[1]:02d}",
                "ratio": ratio,
                "fert_price": f,
                "grain_price": g,
            })

    avg = round(statistics.mean(ratios), 3) if ratios else None
    std = round(statistics.stdev(ratios), 3) if len(ratios) > 1 else None

    # Añadir desvío % respecto al promedio
    if avg:
        for s in series:
            s["deviation_pct"] = round((s["ratio"] - avg) / avg * 100, 1)

    return {
        "grain": grain,
        "grain_market": grain_market,
        "fert": fert,
        "fert_market": fert_market,
        "series": series,
        "average": avg,
        "std_dev": std,
        "current_ratio": series[-1]["ratio"] if series else None,
        "current_deviation_pct": series[-1].get("deviation_pct") if series else None,
    }
