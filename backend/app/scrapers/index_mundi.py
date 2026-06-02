"""
IndexMundi — series históricas de urea, MAP, DAP.
Scraper básico via CSV export de IndexMundi.
"""
import httpx
import csv
import io
from datetime import date, datetime
from sqlalchemy.ext.asyncio import AsyncSession

from app.scrapers.base import BaseScraper
from app.services.price_service import upsert_price

SOURCES = [
    {
        "url": "https://www.indexmundi.com/commodities/commodity=urea&months=120&currency=usd&csv=true",
        "product": "urea",
        "market": "world_cfr",
    },
    {
        "url": "https://www.indexmundi.com/commodities/commodity=dap&months=120&currency=usd&csv=true",
        "product": "dap",
        "market": "world_fob",
    },
]


class IndexMundiScraper(BaseScraper):
    source_name = "IndexMundi"
    source_url = "https://www.indexmundi.com"
    frequency = "monthly"

    async def fetch_and_store(self, db: AsyncSession):
        async with httpx.AsyncClient(timeout=30, headers={"User-Agent": "Mozilla/5.0"}) as client:
            for src in SOURCES:
                try:
                    resp = await client.get(src["url"])
                    resp.raise_for_status()
                    reader = csv.reader(io.StringIO(resp.text))
                    next(reader, None)  # skip header
                    for row in reader:
                        if len(row) < 2:
                            continue
                        try:
                            dt = datetime.strptime(row[0].strip(), "%B %Y")
                            value = float(row[1].strip().replace(",", ""))
                            await upsert_price(
                                db, src["product"], src["market"],
                                dt.date(), value, self.source_name,
                            )
                        except (ValueError, IndexError):
                            continue
                except Exception:
                    pass  # no interrumpir otras fuentes si una falla


async def scrape_index_mundi():
    await IndexMundiScraper().run()
