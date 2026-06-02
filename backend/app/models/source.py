from sqlalchemy import Column, Integer, String, DateTime, Boolean
from sqlalchemy.sql import func
from app.db.database import Base


class DataSource(Base):
    __tablename__ = "data_sources"

    id = Column(Integer, primary_key=True)
    name = Column(String(100), unique=True, nullable=False)
    url = Column(String(500))
    frequency = Column(String(20))  # daily | weekly | monthly
    last_updated = Column(DateTime(timezone=True))
    last_status = Column(String(20), default="pending")  # ok | error | pending
    last_error = Column(String(500))
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
