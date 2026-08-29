"""Market Data API routes."""

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.instrument import MarketInstrument
from app.schemas.market import CandleOut, MarketInstrumentOut, OrderBookOut, QuoteOut
from app.services.market_service import market_service

router = APIRouter(prefix="/api/market", tags=["market"])


@router.get("/instruments", response_model=List[MarketInstrumentOut])
def get_instruments(
    sector: Optional[str] = None,
    query: Optional[str] = None,
    db: Session = Depends(get_db),
):
    """Retrieve catalog of tradable market instruments."""
    q = db.query(MarketInstrument).filter(MarketInstrument.is_tradable == True)
    if sector:
        q = q.filter(MarketInstrument.sector == sector)
    if query:
        search = f"%{query.upper()}%"
        q = q.filter((MarketInstrument.symbol.like(search)) | (MarketInstrument.name.ilike(f"%{query}%")))
    return q.all()


@router.get("/quotes", response_model=List[QuoteOut])
def get_all_quotes(db: Session = Depends(get_db)):
    """Retrieve current live quotes for all instruments."""
    return market_service.get_all_quotes(db)


@router.get("/quote/{symbol}", response_model=QuoteOut)
def get_quote(symbol: str, db: Session = Depends(get_db)):
    """Retrieve live quote for a specific instrument."""
    quote = market_service.get_quote(db, symbol.upper())
    if not quote:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Instrument '{symbol}' not found.")
    return quote


@router.get("/candles/{symbol}", response_model=List[CandleOut])
def get_candles(
    symbol: str,
    timeframe: str = Query("1D", pattern="^(1D|1W|1M|1Y)$"),
    db: Session = Depends(get_db),
):
    """Retrieve historical/intraday OHLCV candle series."""
    return market_service.get_candles(db, symbol.upper(), timeframe)


@router.get("/orderbook/{symbol}", response_model=OrderBookOut)
def get_order_book(symbol: str, db: Session = Depends(get_db)):
    """Retrieve current market depth orderbook for an instrument."""
    return market_service.get_order_book(db, symbol.upper())
