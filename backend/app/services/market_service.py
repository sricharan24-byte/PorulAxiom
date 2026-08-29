"""Market data provider adapter and realistic live feed generator."""

import math
import random
import time
from datetime import datetime, timedelta, timezone
from typing import Dict, List, Optional
from sqlalchemy.orm import Session

from app.models.instrument import MarketInstrument
from app.schemas.market import QuoteOut, CandleOut, OrderBookOut, OrderBookLevel


class MarketService:
    """Manages market quotes, price updates, order book depth, and historical candles."""

    def __init__(self):
        # In-memory cached live prices and intraday drift
        self._price_cache: Dict[str, float] = {}
        self._last_update: Dict[str, float] = {}
        self._open_prices: Dict[str, float] = {}
        self._day_highs: Dict[str, float] = {}
        self._day_lows: Dict[str, float] = {}
        self._day_volumes: Dict[str, int] = {}

    def get_quote(self, db: Session, symbol: str) -> Optional[QuoteOut]:
        """Return current live quote for an instrument."""
        instrument = db.query(MarketInstrument).filter(MarketInstrument.symbol == symbol).first()
        if not instrument:
            return None

        price = self._get_live_price(instrument)
        open_p = self._open_prices.get(symbol, instrument.base_price)
        change = round(price - open_p, 2)
        change_pct = round((change / open_p) * 100, 2) if open_p > 0 else 0.0

        high_p = self._day_highs.get(symbol, max(price, open_p))
        low_p = self._day_lows.get(symbol, min(price, open_p))
        vol = self._day_volumes.get(symbol, 150000)

        return QuoteOut(
            symbol=instrument.symbol,
            name=instrument.name,
            price=price,
            change=change,
            change_percent=change_pct,
            high=high_p,
            low=low_p,
            open=open_p,
            previous_close=instrument.base_price,
            volume=vol,
            timestamp=datetime.now(timezone.utc).isoformat(),
            currency=instrument.currency,
        )

    def get_all_quotes(self, db: Session) -> List[QuoteOut]:
        """Return quotes for all tradable instruments."""
        instruments = db.query(MarketInstrument).filter(MarketInstrument.is_tradable == True).all()
        quotes = []
        for inst in instruments:
            quote = self.get_quote(db, inst.symbol)
            if quote:
                quotes.append(quote)
        return quotes

    def get_candles(self, db: Session, symbol: str, timeframe: str = "1D") -> List[CandleOut]:
        """Generate realistic OHLCV historical candle series."""
        instrument = db.query(MarketInstrument).filter(MarketInstrument.symbol == symbol).first()
        base_price = instrument.base_price if instrument else 1000.0

        candles: List[CandleOut] = []
        now = datetime.now(timezone.utc)

        num_candles = 60
        delta = timedelta(minutes=5)
        if timeframe == "1W":
            num_candles = 84
            delta = timedelta(hours=2)
        elif timeframe == "1M":
            num_candles = 90
            delta = timedelta(hours=8)
        elif timeframe == "1Y":
            num_candles = 120
            delta = timedelta(days=3)

        curr_price = base_price * (0.92 + random.uniform(0, 0.05))
        for i in range(num_candles, 0, -1):
            c_time = now - (delta * i)
            # Brownian walk
            pct_move = random.gauss(0.0008, 0.008)
            o = curr_price
            c = round(o * (1 + pct_move), 2)
            h = round(max(o, c) * (1 + abs(random.gauss(0.002, 0.004))), 2)
            l = round(min(o, c) * (1 - abs(random.gauss(0.002, 0.004))), 2)
            vol = int(random.randint(5000, 50000) * (1 + abs(pct_move) * 20))
            candles.append(CandleOut(
                timestamp=c_time.isoformat(),
                open=o,
                high=h,
                low=l,
                close=c,
                volume=vol,
            ))
            curr_price = c

        # Append latest current live price
        live_p = self._price_cache.get(symbol, curr_price)
        candles.append(CandleOut(
            timestamp=now.isoformat(),
            open=curr_price,
            high=max(curr_price, live_p) * 1.001,
            low=min(curr_price, live_p) * 0.999,
            close=live_p,
            volume=random.randint(2000, 15000),
        ))
        return candles

    def get_order_book(self, db: Session, symbol: str) -> OrderBookOut:
        """Generate realistic order book depth (bids & asks)."""
        instrument = db.query(MarketInstrument).filter(MarketInstrument.symbol == symbol).first()
        if not instrument:
            price = 1000.0
        else:
            price = self._get_live_price(instrument)

        bids = []
        asks = []
        spread = max(0.05, round(price * 0.0003, 2))

        for i in range(1, 6):
            bid_price = round(price - (spread * i) - (random.uniform(0.01, 0.1) * i), 2)
            ask_price = round(price + (spread * i) + (random.uniform(0.01, 0.1) * i), 2)
            bids.append(OrderBookLevel(
                price=bid_price,
                quantity=random.randint(50, 1200) * (6 - i),
                orders=random.randint(2, 25),
            ))
            asks.append(OrderBookLevel(
                price=ask_price,
                quantity=random.randint(50, 1200) * (6 - i),
                orders=random.randint(2, 25),
            ))

        return OrderBookOut(
            symbol=symbol,
            timestamp=datetime.now(timezone.utc).isoformat(),
            bids=bids,
            asks=asks,
        )

    def _get_live_price(self, instrument: MarketInstrument) -> float:
        """Simulate realistic continuous price fluctuations."""
        sym = instrument.symbol
        now_ts = time.time()

        if sym not in self._price_cache:
            self._price_cache[sym] = instrument.base_price
            self._open_prices[sym] = instrument.base_price
            self._day_highs[sym] = instrument.base_price
            self._day_lows[sym] = instrument.base_price
            self._day_volumes[sym] = random.randint(100000, 500000)
            self._last_update[sym] = now_ts

        # If updated within last 0.5 sec, return cached
        if now_ts - self._last_update[sym] < 0.5:
            return self._price_cache[sym]

        # Apply small realistic tick movement
        pct_change = random.gauss(0.0, 0.0012)
        new_price = round(self._price_cache[sym] * (1.0 + pct_change), 2)
        # Bounded within 10% circuit limit of base price
        lower_bound = round(instrument.base_price * 0.85, 2)
        upper_bound = round(instrument.base_price * 1.15, 2)
        new_price = max(lower_bound, min(upper_bound, new_price))

        self._price_cache[sym] = new_price
        self._last_update[sym] = now_ts
        self._day_highs[sym] = max(self._day_highs[sym], new_price)
        self._day_lows[sym] = min(self._day_lows[sym], new_price)
        self._day_volumes[sym] += random.randint(10, 150)

        return new_price


market_service = MarketService()
