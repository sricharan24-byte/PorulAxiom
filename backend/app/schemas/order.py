"""Order and Trade Pydantic schemas."""

from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field


class OrderCreate(BaseModel):
    symbol: str
    side: str = Field(..., pattern="^(BUY|SELL)$")
    order_type: str = Field(..., pattern="^(MARKET|LIMIT)$")
    quantity: float = Field(..., gt=0)
    price: Optional[float] = Field(None, gt=0)  # Required if LIMIT order


class OrderOut(BaseModel):
    id: str
    symbol: str
    side: str
    order_type: str
    price: float
    quantity: float
    filled_quantity: float
    status: str
    rejection_reason: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class TradeOut(BaseModel):
    id: str
    order_id: str
    symbol: str
    side: str
    quantity: float
    executed_price: float
    executed_at: datetime

    model_config = ConfigDict(from_attributes=True)
