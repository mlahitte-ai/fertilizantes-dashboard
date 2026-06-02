"""
World Bank Pink Sheet — precios mensuales de fertilizantes.
API pública: https://api.worldbank.org/v2/en/indicator/{indicator}?format=json
Indicadores:
  - Urea: PNRGUREA.M (o vía CSV del Pink Sheet)
  - DAP:  PNRGDAP.M
  - Potash: PNRGPOTA.M
"""
import httpx
from datetime import date
from sqlalchemy.ext.asyncio import AsyncSession

from app.scrapers.base import BaseScraper
from app.services.price_service import upsert_price

# World Bank commodity codes → (product, market)
WB_SERIES = {
    "PUREA": ("urea", "world_cfr"),
    "PDAP": ("dap", "world_fob"),
    "PPOTASHM": ("potash", "world_cfr"),
}


class WorldBankScraper(BaseScraper):
    source_name = "World Bank Pink Sheet"
    source_url = "https://api.worldbank.org"
    frequency = "monthly"

    async def fetch_and_store(self, db: AsyncSession):
        async with httpx.AsyncClient(timeout=60) as client:
            for series_code, (product, market) in WB_SERIES.items():
                url = (
                    f"https://api.worldbank.org/v2/en/indicator/{series_code}"
                    f"?format=json&mrv=84&frequency=M"
                )
                resp = await client.get(url)
                if resp.status_code != 200:
                    continue

                data = resp.json()
                if len(data) < 2 or not data[1]:
                    continue

                for entry in data[1]:
                    if entry.get("value") is None:
                        continue
                    period = entry["date"]  # formato "2024M06"
                    try:
                        y = int(period[:4])
                        m = int(period[5:])
                        price_date = date(y, m, 1)
                    except (ValueError, IndexError):
                        continue

                    await upsert_price(
                        db, product, market, price_date,
                        round(float(entry["value"]), 2),
                        self.source_name,
                    )


async def scrape_world_bank():
    await WorldBankScraper().run()
