"""Holding model representing shares owned by an account."""

import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Float, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship

from app.core.database import Base


class Holding(Base):
    __tablename__ = "holdings"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    account_id = Column(String(36), ForeignKey("accounts.id", ondelete="CASCADE"), nullable=False)
    symbol = Column(String(30), ForeignKey("market_instruments.symbol"), nullable=False)
    quantity = Column(Float, default=0.0, nullable=False)
    average_buy_price = Column(Float, default=0.0, nullable=False)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    account = relationship("Account", back_populates="holdings")
    instrument = relationship("MarketInstrument")

    __table_args__ = (
        UniqueConstraint("account_id", "symbol", name="uq_account_symbol"),
    )
