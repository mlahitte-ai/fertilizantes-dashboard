from sqlalchemy import Column, Integer, String, Float, Date, DateTime, UniqueConstraint
from sqlalchemy.sql import func
from app.db.database import Base


class Price(Base):
    """
    Un registro de precio para un producto en un mercado en una fecha.
    product:  urea | map | dap | potash | anhydrous | soy | corn | wheat
    market:   world_cfr | world_fob | arg_fca | us | cbot | bcr_fas
    unit:     usd_per_ton
    """
    __tablename__ = "prices"

    id = Column(Integer, primary_key=True, index=True)
    product = Column(String(50), nullable=False, index=True)
    market = Column(String(50), nullable=False, index=True)
    date = Column(Date, nullable=False, index=True)
    value = Column(Float, nullable=False)
    source = Column(String(100))
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    __table_args__ = (
        UniqueConstraint("product", "market", "date", name="uq_price_product_market_date"),
    )
