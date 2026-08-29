"""Admin Management and Inspection Pydantic schemas."""

from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, ConfigDict, Field


class UserAdminView(BaseModel):
    id: str
    email: str
    username: str
    role: str
    is_active: bool
    cash_balance: float
    holdings_count: int
    orders_count: int
    trades_count: int
    created_at: datetime


class UserStatusUpdate(BaseModel):
    is_active: bool


class AdminPasswordReset(BaseModel):
    new_password: str = Field(..., min_length=6)


class CapitalAdjustmentRequest(BaseModel):
    target_user_id: str
    amount: float = Field(..., description="Positive to credit virtual cash, negative to debit")
    reason: str = Field(..., min_length=5, description="Auditable administrative justification")


class AuditLogOut(BaseModel):
    id: str
    actor_id: Optional[str]
    actor_username: Optional[str] = None
    action: str
    target_user_id: Optional[str]
    target_username: Optional[str] = None
    details: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
