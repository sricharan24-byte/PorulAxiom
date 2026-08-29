"""Immutable ledger transactions for cash movements and admin capital adjustments."""

import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Float, DateTime, ForeignKey, Text, Boolean
from sqlalchemy.orm import relationship

from app.core.database import Base


class LedgerTransaction(Base):
    __tablename__ = "ledger_transactions"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False, index=True)
    type = Column(String(50), nullable=False)  # INITIAL_GRANT, TRADE_DEBIT, TRADE_CREDIT, ADMIN_ADJUSTMENT
    amount = Column(Float, nullable=False)  # Positive for credit, negative for debit
    balance_after = Column(Float, nullable=False)
    description = Column(Text, nullable=False)
    is_external_flow = Column(Boolean, default=False, nullable=False)  # True for adjustments/grants to neutralize return %
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), index=True)

    user = relationship("User", back_populates="ledger_entries")
