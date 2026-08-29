"""Portfolio and Performance Pydantic schemas."""

from typing import List, Dict
from pydantic import BaseModel


class HoldingOut(BaseModel):
    id: str
    symbol: str
    name: str
    quantity: float
    average_buy_price: float
    current_price: float
    current_value: float
    invested_value: float
    unrealized_pnl: float
    unrealized_pnl_percent: float
    currency: str


class PortfolioSummary(BaseModel):
    cash_balance: float
    invested_value: float
    current_holdings_value: float
    net_worth: float
    total_unrealized_pnl: float
    total_realized_pnl: float
    total_pnl: float
    # Time-Weighted Return (TWR) neutralizing external cash flows
    return_percentage: float
    currency: str
    holdings: List[HoldingOut]


class AssetAllocation(BaseModel):
    symbol: str
    name: str
    value: float
    percentage: float
