"""Immutable trade execution record model."""

import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Float, DateTime, ForeignKey
from sqlalchemy.orm import relationship

from app.core.database import Base


class Trade(Base):
    __tablename__ = "trades"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    order_id = Column(String(36), ForeignKey("orders.id"), nullable=False)
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False, index=True)
    symbol = Column(String(30), ForeignKey("market_instruments.symbol"), nullable=False)
    side = Column(String(10), nullable=False)  # 'BUY' or 'SELL'
    quantity = Column(Float, nullable=False)
    executed_price = Column(Float, nullable=False)
    executed_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), index=True)

    order = relationship("Order", back_populates="trades")
    user = relationship("User", back_populates="trades")
    instrument = relationship("MarketInstrument")
