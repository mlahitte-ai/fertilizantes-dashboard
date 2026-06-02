from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from datetime import date
from typing import Optional

from app.db.database import get_db
from app.models.price import Price
from app.services.price_service import get_current_prices, get_price_history

router = APIRouter()


@router.get("/current")
async def current_prices(db: AsyncSession = Depends(get_db)):
    """Precios más recientes de todos los productos."""
    return await get_current_prices(db)


@router.get("/history")
async def price_history(
    product: str = Query(..., description="ej: urea_arg, urea_world, soy_cbot"),
    from_date: Optional[str] = Query(None, alias="from", description="YYYY-MM"),
    to_date: Optional[str] = Query(None, alias="to", description="YYYY-MM"),
    db: AsyncSession = Depends(get_db),
):
    """Serie histórica para un producto específico."""
    # product format: {product}_{market_alias}
    parts = product.rsplit("_", 1)
    if len(parts) != 2:
        from fastapi import HTTPException
        raise HTTPException(400, "product debe tener formato: {producto}_{mercado} — ej: urea_arg")

    product_name, market_alias = parts
    market_map = {
        "arg": "arg_fca",
        "world": "world_cfr",
        "cbot": "cbot",
        "bcr": "bcr_fas",
        "us": "us",
    }
    market = market_map.get(market_alias, market_alias)

    return await get_price_history(db, product_name, market, from_date, to_date)
