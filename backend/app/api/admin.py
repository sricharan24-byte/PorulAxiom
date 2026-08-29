"""Admin Operations API routes with strict security constraints."""

from typing import List
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import require_admin
from app.models.user import User
from app.schemas.admin import (
    AdminPasswordReset,
    AuditLogOut,
    CapitalAdjustmentRequest,
    UserAdminView,
    UserStatusUpdate,
)
from app.schemas.ledger import LedgerTransactionOut
from app.schemas.portfolio import PortfolioSummary
from app.services.admin_service import admin_service

router = APIRouter(prefix="/api/admin", tags=["admin"])


@router.get("/users", response_model=List[UserAdminView])
def get_all_users(
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """List all registered users with trading metrics."""
    return admin_service.list_users(db, admin)


@router.get("/users/{user_id}/portfolio", response_model=PortfolioSummary)
def inspect_user_portfolio(
    user_id: str,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """Inspect a user's holdings and portfolio (read-only for admin)."""
    return admin_service.inspect_user_portfolio(db, admin, user_id)


@router.post("/users/{user_id}/status")
def set_user_status(
    user_id: str,
    body: UserStatusUpdate,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """Activate or deactivate a user account."""
    updated = admin_service.set_user_status(db, admin, user_id, body.is_active)
    return {"status": "success", "user_id": updated.id, "is_active": updated.is_active}


@router.post("/users/{user_id}/reset-password")
def reset_user_password(
    user_id: str,
    body: AdminPasswordReset,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """Reset a user's password securely without viewing password."""
    admin_service.reset_user_password(db, admin, user_id, body.new_password)
    return {"status": "success", "message": "Password reset successfully."}


@router.post("/capital-adjust", response_model=LedgerTransactionOut)
def adjust_virtual_capital(
    body: CapitalAdjustmentRequest,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """Perform authorized virtual capital adjustment (credit/debit)."""
    return admin_service.adjust_virtual_capital(db, admin, body)


@router.get("/audit-logs", response_model=List[AuditLogOut])
def get_audit_logs(
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """Retrieve system audit logs for administrative oversight."""
    return admin_service.get_audit_logs(db, admin)
