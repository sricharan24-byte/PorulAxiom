"""API package export."""

from app.api.admin import router as admin_router
from app.api.auth import router as auth_router
from app.api.friends import router as friends_router
from app.api.ledger import router as ledger_router
from app.api.market import router as market_router
from app.api.orders import router as orders_router
from app.api.portfolio import router as portfolio_router
from app.api.ws import router as ws_router

__all__ = [
    "auth_router",
    "market_router",
    "orders_router",
    "portfolio_router",
    "friends_router",
    "ledger_router",
    "admin_router",
    "ws_router",
]
