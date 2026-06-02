import pytest
from app.services.ratio_service import compute_ratio


@pytest.mark.asyncio
async def test_ratio_empty_db(async_db_session):
    result = await compute_ratio(async_db_session, "soy", "cbot", "urea", "world_cfr", 12)
    assert result["series"] == []
    assert result["average"] is None
