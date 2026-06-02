from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import get_db
from app.services.ratio_service import compute_ratio

router = APIRouter()

VALID_GRAINS = {"soy", "corn", "wheat"}
VALID_GRAIN_MARKETS = {"cbot", "bcr_fas"}
VALID_FERTS = {"urea", "map", "dap", "potash", "anhydrous"}
VALID_FERT_MARKETS = {"world_cfr", "arg_fca", "us"}


@router.get("")
async def ratio(
    grain: str = Query(...),
    grain_market: str = Query(...),
    fert: str = Query(...),
    fert_market: str = Query(...),
    months: int = Query(30, ge=1, le=120),
    db: AsyncSession = Depends(get_db),
):
    """
    Relación toneladas de grano necesarias para comprar 1 tn de fertilizante.
    Devuelve la serie mensual + promedio + desvío estándar del período.
    """
    from fastapi import HTTPException

    if grain not in VALID_GRAINS:
        raise HTTPException(400, f"grain debe ser uno de: {VALID_GRAINS}")
    if grain_market not in VALID_GRAIN_MARKETS:
        raise HTTPException(400, f"grain_market debe ser uno de: {VALID_GRAIN_MARKETS}")
    if fert not in VALID_FERTS:
        raise HTTPException(400, f"fert debe ser uno de: {VALID_FERTS}")
    if fert_market not in VALID_FERT_MARKETS:
        raise HTTPException(400, f"fert_market debe ser uno de: {VALID_FERT_MARKETS}")

    # Advertencia por mezcla de mercados incompatibles
    warning = None
    if grain_market == "bcr_fas" and fert_market == "world_cfr":
        warning = "Estás comparando precio grano FAS Argentina con fertilizante precio mundial (no incluye logística ARG)"
    elif grain_market == "cbot" and fert_market == "arg_fca":
        warning = "Estás comparando precio grano CBOT (USD internacional) con fertilizante FCA Argentina"

    result = await compute_ratio(db, grain, grain_market, fert, fert_market, months)
    if warning:
        result["warning"] = warning
    return result
