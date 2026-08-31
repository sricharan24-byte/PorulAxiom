"""HTTP and WebSocket entry point for the PorulAxiom modular monolith engine."""

import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from app.api import (
    admin_router,
    auth_router,
    friends_router,
    ledger_router,
    market_router,
    orders_router,
    portfolio_router,
    ws_router,
)
from app.core.config import get_settings
from app.core.database import Base, SessionLocal, engine
from app.core.security import get_password_hash
from app.models import Account, Friendship, LedgerTransaction, MarketInstrument, User

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(name)s %(message)s",
)
logger = logging.getLogger(__name__)
settings = get_settings()

app = FastAPI(
    title="PorulAxiom Engine",
    version="1.0.0",
    description="Modular monolith paper-trading engine with realistic market execution and auditable financial state.",
)

# CORS Middleware (Allows Next.js frontend on localhost, Vercel, and custom domains)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount Routers
app.include_router(auth_router)
app.include_router(market_router)
app.include_router(orders_router)
app.include_router(portfolio_router)
app.include_router(friends_router)
app.include_router(ledger_router)
app.include_router(admin_router)
app.include_router(ws_router)


def seed_initial_data(db: Session) -> None:
    """Seed initial database fixtures if not already present."""
    # 1. Seed Market Instruments
    instruments_data = [
        ("RELIANCE", "Reliance Industries Ltd", "NSE", "Energy & Conglomerate", 2950.00, "INR"),
        ("TCS", "Tata Consultancy Services Ltd", "NSE", "Technology", 4120.00, "INR"),
        ("INFY", "Infosys Ltd", "NSE", "Technology", 1880.00, "INR"),
        ("HDFCBANK", "HDFC Bank Ltd", "NSE", "Banking & Finance", 1650.00, "INR"),
        ("TATAMOTORS", "Tata Motors Ltd", "NSE", "Automotive", 1040.00, "INR"),
        ("ICICIBANK", "ICICI Bank Ltd", "NSE", "Banking & Finance", 1230.00, "INR"),
        ("SBIN", "State Bank of India", "NSE", "Banking & Finance", 815.00, "INR"),
        ("AAPL", "Apple Inc", "NASDAQ", "Technology", 225.00, "USD"),
        ("NVDA", "NVIDIA Corporation", "NASDAQ", "Semiconductors", 128.00, "USD"),
        ("TSLA", "Tesla Inc", "NASDAQ", "Automotive & Clean Tech", 215.00, "USD"),
        ("MSFT", "Microsoft Corporation", "NASDAQ", "Technology", 448.00, "USD"),
        ("GOOGL", "Alphabet Inc", "NASDAQ", "Technology", 182.00, "USD"),
    ]

    for sym, name, exch, sec, price, curr in instruments_data:
        if not db.query(MarketInstrument).filter(MarketInstrument.symbol == sym).first():
            db.add(MarketInstrument(
                symbol=sym,
                name=name,
                exchange=exch,
                sector=sec,
                base_price=price,
                currency=curr,
                is_tradable=True,
            ))

    # 2. Seed Single Admin User
    admin_user = db.query(User).filter(User.role == "ADMIN").first()
    if not admin_user:
        admin_user = User(
            id="a0000000-0000-0000-0000-000000000001",
            email="admin@porulaxiom.local",
            username="admin",
            password_hash=get_password_hash("AdminPass123!"),
            role="ADMIN",
            is_active=True,
        )
        db.add(admin_user)
    else:
        admin_user.password_hash = get_password_hash("AdminPass123!")

    # 3. Seed Demo Trader Mokshit
    demo_trader = db.query(User).filter(User.id == "b0000000-0000-0000-0000-000000000001").first()
    if not demo_trader:
        demo_trader = User(
            id="b0000000-0000-0000-0000-000000000001",
            email="mokshit@porulaxiom.local",
            username="trader_mokshit",
            password_hash=get_password_hash("TraderPass123!"),
            role="USER",
            is_active=True,
        )
        db.add(demo_trader)
        db.flush()

        acct = Account(
            user_id=demo_trader.id,
            cash_balance=1_000_000.0,
            currency="INR",
        )
        db.add(acct)

        ledger = LedgerTransaction(
            user_id=demo_trader.id,
            type="INITIAL_GRANT",
            amount=1_000_000.0,
            balance_after=1_000_000.0,
            description="Initial paper trading virtual balance grant",
            is_external_flow=True,
        )
        db.add(ledger)
    else:
        demo_trader.email = "mokshit@porulaxiom.local"
        demo_trader.username = "trader_mokshit"
        demo_trader.password_hash = get_password_hash("TraderPass123!")

    db.commit()


@app.on_event("startup")
async def startup_event() -> None:
    """Initialize schema and seed data on startup."""
    logger.info("Initializing database tables for %s environment...", settings.app_env)
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        seed_initial_data(db)
        logger.info("PorulAxiom engine startup completed successfully.")
    finally:
        db.close()


@app.get("/health", tags=["system"])
async def health() -> dict[str, str]:
    """Return dependency-free liveness status."""
    return {"status": "ok", "service": "porulaxiom-engine", "version": "1.0.0"}
