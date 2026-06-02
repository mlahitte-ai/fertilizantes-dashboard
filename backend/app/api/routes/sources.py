from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.db.database import get_db
from app.models.source import DataSource

router = APIRouter()


@router.get("/status")
async def sources_status(db: AsyncSession = Depends(get_db)):
    """Estado de cada fuente de datos (última actualización, errores)."""
    result = await db.execute(select(DataSource).order_by(DataSource.name))
    sources = result.scalars().all()
    return [
        {
            "name": s.name,
            "url": s.url,
            "frequency": s.frequency,
            "last_updated": s.last_updated,
            "last_status": s.last_status,
            "last_error": s.last_error,
            "is_active": s.is_active,
        }
        for s in sources
    ]
