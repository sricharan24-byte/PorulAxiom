"""Order Placement and Management API routes."""

from typing import List, Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_current_active_user
from app.models.order import Order
from app.models.trade import Trade
from app.models.user import User
from app.schemas.order import OrderCreate, OrderOut, TradeOut
from app.services.trading_engine import trading_engine

router = APIRouter(prefix="/api/orders", tags=["orders"])


@router.post("", response_model=OrderOut, status_code=status.HTTP_201_CREATED)
def place_order(
    order_in: OrderCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """Place a simulated paper order (Market or Limit)."""
    return trading_engine.place_order(db, current_user, order_in)


@router.get("", response_model=List[OrderOut])
def get_orders(
    status_filter: Optional[str] = Query(None, alias="status"),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """List orders placed by the current user."""
    q = db.query(Order).filter(Order.user_id == current_user.id)
    if status_filter:
        q = q.filter(Order.status == status_filter.upper())
    return q.order_by(Order.created_at.desc()).all()


@router.get("/trades", response_model=List[TradeOut])
def get_trades(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """List trade executions for the current user."""
    return (
        db.query(Trade)
        .filter(Trade.user_id == current_user.id)
        .order_by(Trade.executed_at.desc())
        .all()
    )


@router.delete("/{order_id}", response_model=OrderOut)
def cancel_order(
    order_id: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """Cancel a pending limit order owned by the user."""
    return trading_engine.cancel_order(db, current_user, order_id)
