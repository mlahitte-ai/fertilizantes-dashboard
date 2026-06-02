from abc import ABC, abstractmethod
from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.database import AsyncSessionLocal
from app.models.source import DataSource
from sqlalchemy import select


class BaseScraper(ABC):
    source_name: str = ""
    source_url: str = ""
    frequency: str = "weekly"

    async def run(self):
        async with AsyncSessionLocal() as db:
            try:
                await self.fetch_and_store(db)
                await self._update_source_status(db, "ok", None)
            except Exception as e:
                await self._update_source_status(db, "error", str(e))
                raise

    @abstractmethod
    async def fetch_and_store(self, db: AsyncSession) -> None:
        ...

    async def _update_source_status(self, db: AsyncSession, status: str, error: str | None):
        result = await db.execute(
            select(DataSource).where(DataSource.name == self.source_name)
        )
        row = result.scalar_one_or_none()
        if not row:
            row = DataSource(
                name=self.source_name,
                url=self.source_url,
                frequency=self.frequency,
            )
            db.add(row)
        row.last_updated = datetime.utcnow()
        row.last_status = status
        row.last_error = error
        await db.commit()
