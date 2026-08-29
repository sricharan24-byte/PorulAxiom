"""Immutable order record model."""

import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Float, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship

from app.core.database import Base


class Order(Base):
    __tablename__ = "orders"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False, index=True)
    symbol = Column(String(30), ForeignKey("market_instruments.symbol"), nullable=False)
    side = Column(String(10), nullable=False)  # 'BUY' or 'SELL'
    order_type = Column(String(10), nullable=False)  # 'MARKET' or 'LIMIT'
    price = Column(Float, nullable=False)
    quantity = Column(Float, nullable=False)
    filled_quantity = Column(Float, default=0.0, nullable=False)
    status = Column(String(20), default="PENDING", nullable=False, index=True)  # PENDING, FILLED, CANCELLED, REJECTED
    rejection_reason = Column(Text, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), index=True)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    user = relationship("User", back_populates="orders")
    instrument = relationship("MarketInstrument")
    trades = relationship("Trade", back_populates="order")
