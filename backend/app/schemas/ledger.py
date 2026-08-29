"""Financial Ledger Pydantic schemas."""

from datetime import datetime
from pydantic import BaseModel, ConfigDict


class LedgerTransactionOut(BaseModel):
    id: str
    type: str
    amount: float
    balance_after: float
    description: str
    is_external_flow: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
