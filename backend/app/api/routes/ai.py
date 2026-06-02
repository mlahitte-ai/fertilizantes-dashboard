from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional, List
import anthropic

from app.core.config import settings
from app.db.database import get_db
from app.services.price_service import get_current_prices
from sqlalchemy.ext.asyncio import AsyncSession

router = APIRouter()

PREDEFINED_QUERIES = {
    "current_prices": "Buscá el precio actual de urea, MAP y DAP en Argentina (FCA) y el mercado internacional. Fuentes: investing.com, bichosdecampo.com, agrolatam.com. Comparalos con los valores históricos disponibles.",
    "grains_prices": "Buscá el precio actual de soja, maíz y trigo en Chicago (CBOT) y en la Bolsa de Comercio de Rosario (BCR FAS) hoy.",
    "ratio_vs_historical": "¿Cuál es la relación insumo/producto urea-trigo y MAP-soja en Argentina actualmente? Comparala con el promedio histórico de los últimos 7 años.",
    "buy_timing": "¿Conviene comprar urea o MAP ahora o esperar? Análisis de timing de compra para productor argentino campaña fina 2026/27.",
    "external_factors": "¿Cuál es el impacto de los factores externos actuales (conflicto Medio Oriente, restricciones China, azufre, energía) sobre los precios de fertilizantes para Argentina?",
}


class AnalyzeRequest(BaseModel):
    query: str
    predefined_key: Optional[str] = None


@router.get("/predefined")
async def predefined_queries():
    return [{"key": k, "label": v[:80] + "..."} for k, v in PREDEFINED_QUERIES.items()]


@router.post("/analyze")
async def analyze(
    body: AnalyzeRequest,
    db: AsyncSession = Depends(get_db),
):
    if not settings.anthropic_api_key:
        raise HTTPException(500, "ANTHROPIC_API_KEY no configurada")

    # Resolver query predefinida
    user_query = body.query
    if body.predefined_key and body.predefined_key in PREDEFINED_QUERIES:
        user_query = PREDEFINED_QUERIES[body.predefined_key]

    # Inyectar contexto de precios actuales
    current = await get_current_prices(db)
    price_context = _format_price_context(current)

    system_prompt = f"""Sos un analista especializado en mercados de fertilizantes y commodities agrícolas argentinos.
Respondé siempre en español. Usá los datos de precios actuales que tenés disponibles como contexto base,
y complementá con búsquedas web para obtener información más reciente si es necesario.
Máximo 3 párrafos, orientado al productor argentino. Sin viñetas.

Contexto de precios en la base de datos (más recientes disponibles):
{price_context}

Contexto de mercado jun 2026:
- Conflicto Medio Oriente afecta el Estrecho de Ormuz → encarece logística de urea
- China restringió exportaciones de fosfatados → MAP/DAP en máximos desde 2022
- Azufre +100% desde ene 2026 (impacto en costos de producción de MAP/DAP)
- Urea +60% en lo que va de 2026; Banco Mundial proyecta +30% adicional
- Relación insumo/producto actual: urea/soja (BCR FAS) ~3.7 tn — históricamente el promedio es 2.0–2.5 tn
- Relación MAP/soja actual ~4.3 tn — históricamente promedio 2.8–3.2 tn

Hoy es {_today()}.
"""

    client = anthropic.Anthropic(api_key=settings.anthropic_api_key)

    # Llamada con tool use (web_search)
    response = client.messages.create(
        model="claude-sonnet-4-20250514",
        max_tokens=2048,
        system=system_prompt,
        tools=[{"type": "web_search_20250305", "name": "web_search", "max_uses": 3}],
        messages=[{"role": "user", "content": user_query}],
    )

    # Extraer texto de la respuesta (ignorar tool_use blocks)
    text_blocks = [b.text for b in response.content if hasattr(b, "text") and b.text is not None]
    return {
        "response": "\n".join(text_blocks),
        "query": user_query,
        "input_tokens": response.usage.input_tokens,
        "output_tokens": response.usage.output_tokens,
    }


def _format_price_context(prices: list) -> str:
    if not prices:
        return "No hay datos de precios en la base de datos aún."
    lines = []
    for p in prices:
        lines.append(f"- {p['product']} ({p['market']}): USD {p['value']:.1f}/tn — {p['date']}")
    return "\n".join(lines)


def _today() -> str:
    from datetime import date
    return date.today().isoformat()
