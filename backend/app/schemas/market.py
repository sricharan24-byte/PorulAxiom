"""Market data Pydantic schemas."""

from typing import List, Optional
from pydantic import BaseModel, ConfigDict


class MarketInstrumentOut(BaseModel):
    symbol: str
    name: str
    exchange: str
    sector: str
    base_price: float
    currency: str
    is_tradable: bool

    model_config = ConfigDict(from_attributes=True)


class QuoteOut(BaseModel):
    symbol: str
    name: str
    price: float
    change: float
    change_percent: float
    high: float
    low: float
    open: float
    previous_close: float
    volume: int
    timestamp: str
    currency: str


class CandleOut(BaseModel):
    timestamp: str
    open: float
    high: float
    low: float
    close: float
    volume: int


class OrderBookLevel(BaseModel):
    price: float
    quantity: int
    orders: int


class OrderBookOut(BaseModel):
    symbol: str
    timestamp: str
    bids: List[OrderBookLevel]
    asks: List[OrderBookLevel]
