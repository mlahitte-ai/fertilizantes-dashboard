"""
Scraper para precios CBOT (soja, maíz, trigo) vía Yahoo Finance.
Símbolo: ZS=F (soja cents/bushel), ZC=F (maíz), ZW=F (trigo).
Se convierte de cents/bushel → USD/tn.
"""
import httpx
from datetime import date
from sqlalchemy.ext.asyncio import AsyncSession

from app.scrapers.base import BaseScraper
from app.services.price_service import upsert_price

# Conversión: 1 bushel soja = 27.2155 kg → 1 tn = 36.744 bushels
# 1 bushel maíz/trigo = 25.4012 kg → 1 tn = 39.368 bushels
BUSHEL_TO_TON = {
    "soy": 36.744,
    "corn": 39.368,
    "wheat": 39.368,
}

SYMBOLS = {
    "soy": "ZS=F",
    "corn": "ZC=F",
    "wheat": "ZW=F",
}


class CBOTScraper(BaseScraper):
    source_name = "CBOT / CME"
    source_url = "https://finance.yahoo.com"
    frequency = "daily"

    async def fetch_and_store(self, db: AsyncSession):
        today = date.today()
        async with httpx.AsyncClient(timeout=30) as client:
            for product, symbol in SYMBOLS.items():
                url = f"https://query1.finance.yahoo.com/v8/finance/chart/{symbol}?interval=1d&range=5d"
                resp = await client.get(url, headers={"User-Agent": "Mozilla/5.0"})
                resp.raise_for_status()
                data = resp.json()

                closes = data["chart"]["result"][0]["indicators"]["quote"][0]["close"]
                timestamps = data["chart"]["result"][0]["timestamp"]

                # Tomar el cierre más reciente válido
                for ts, close in zip(reversed(timestamps), reversed(closes)):
                    if close is not None:
                        price_date = date.fromtimestamp(ts)
                        # cents/bushel → USD/tn
                        usd_per_ton = round((close / 100) * BUSHEL_TO_TON[product], 2)
                        await upsert_price(db, product, "cbot", price_date, usd_per_ton, self.source_name)
                        break


async def scrape_cbot():
    await CBOTScraper().run()
