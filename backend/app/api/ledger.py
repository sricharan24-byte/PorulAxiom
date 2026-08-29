"""Ledger and Financial Notifications API routes."""

from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_current_active_user
from app.models.ledger import LedgerTransaction
from app.models.user import User
from app.schemas.ledger import LedgerTransactionOut

router = APIRouter(prefix="/api/ledger", tags=["ledger"])


@router.get("", response_model=List[LedgerTransactionOut])
def get_user_ledger(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """Retrieve full cash transaction history, including capital adjustments."""
    return (
        db.query(LedgerTransaction)
        .filter(LedgerTransaction.user_id == current_user.id)
        .order_by(LedgerTransaction.created_at.desc())
        .all()
    )


@router.get("/adjustments", response_model=List[LedgerTransactionOut])
def get_user_admin_adjustments(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """Retrieve administrative capital adjustments visible to the user."""
    return (
        db.query(LedgerTransaction)
        .filter(
            LedgerTransaction.user_id == current_user.id,
            LedgerTransaction.type == "ADMIN_ADJUSTMENT",
        )
        .order_by(LedgerTransaction.created_at.desc())
        .all()
    )
