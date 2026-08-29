"""Market instrument definition model."""

from datetime import datetime, timezone
from sqlalchemy import Column, String, Float, Boolean, DateTime
from app.core.database import Base


class MarketInstrument(Base):
    __tablename__ = "market_instruments"

    symbol = Column(String(30), primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    exchange = Column(String(50), default="NSE", nullable=False)
    sector = Column(String(100), nullable=False)
    base_price = Column(Float, nullable=False)
    currency = Column(String(10), default="INR", nullable=False)
    is_tradable = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
