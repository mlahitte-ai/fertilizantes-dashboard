"""
Scraper BCR — precios FAS teórico y paridad importación fertilizantes.
Los precios FAS se calculan desde CBOT aplicando retenciones.
BCR publica datos en bcr.com.ar; como alternativa se calculan internamente.
"""
from datetime import date
from sqlalchemy.ext.asyncio import AsyncSession

from app.scrapers.base import BaseScraper
from app.services.price_service import upsert_price, get_current_prices

# Retenciones vigentes (actualizar si cambia la política)
RETENTION = {
    "soy": 0.33,
    "corn": 0.12,
    "wheat": 0.12,
}


class BCRScraper(BaseScraper):
    source_name = "BCR FAS teórico"
    source_url = "https://www.bcr.com.ar"
    frequency = "daily"

    async def fetch_and_store(self, db: AsyncSession):
        """
        Calcula precio FAS BCR desde precios CBOT ya almacenados.
        FAS = CBOT * (1 - retención)
        """
        current = await get_current_prices(db)
        cbot_prices = {p["product"]: p for p in current if p["market"] == "cbot"}

        today = date.today()
        for grain, retention in RETENTION.items():
            if grain in cbot_prices:
                cbot_val = cbot_prices[grain]["value"]
                fas = round(cbot_val * (1 - retention), 2)
                await upsert_price(db, grain, "bcr_fas", today, fas, self.source_name)


async def scrape_bcr():
    await BCRScraper().run()
