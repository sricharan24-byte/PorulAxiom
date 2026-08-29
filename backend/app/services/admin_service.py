"""Admin service with strict boundary enforcement and auditable workflows."""

import json
import logging
from datetime import datetime, timezone
from typing import List, Optional
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.core.security import get_password_hash
from app.models.account import Account
from app.models.audit import AuditLog
from app.models.holding import Holding
from app.models.ledger import LedgerTransaction
from app.models.order import Order
from app.models.trade import Trade
from app.models.user import User
from app.schemas.admin import UserAdminView, CapitalAdjustmentRequest, AuditLogOut
from app.schemas.portfolio import PortfolioSummary
from app.services.portfolio_service import portfolio_service

logger = logging.getLogger(__name__)


class AdminService:
    """Manages administrative actions adhering to non-negotiable security boundaries."""

    def list_users(self, db: Session, admin: User) -> List[UserAdminView]:
        """List all users with key operational metrics."""
        users = db.query(User).order_by(User.created_at.desc()).all()
        result = []

        for u in users:
            account = db.query(Account).filter(Account.user_id == u.id).first()
            cash = account.cash_balance if account else 0.0
            h_count = db.query(Holding).filter(Holding.account_id == account.id).count() if account else 0
            o_count = db.query(Order).filter(Order.user_id == u.id).count()
            t_count = db.query(Trade).filter(Trade.user_id == u.id).count()

            result.append(UserAdminView(
                id=u.id,
                email=u.email,
                username=u.username,
                role=u.role,
                is_active=u.is_active,
                cash_balance=round(cash, 2),
                holdings_count=h_count,
                orders_count=o_count,
                trades_count=t_count,
                created_at=u.created_at,
            ))
        return result

    def inspect_user_portfolio(self, db: Session, admin: User, user_id: str) -> PortfolioSummary:
        """Inspect a user's portfolio and holdings (read-only)."""
        target_user = db.query(User).filter(User.id == user_id).first()
        if not target_user:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found.")
        return portfolio_service.get_portfolio_summary(db, target_user)

    def set_user_status(self, db: Session, admin: User, user_id: str, is_active: bool) -> User:
        """Activate or deactivate a user account with audit record."""
        target_user = db.query(User).filter(User.id == user_id).first()
        if not target_user:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found.")

        if target_user.role == "ADMIN" and not is_active:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot deactivate the single platform administrator account.",
            )

        prev_status = target_user.is_active
        target_user.is_active = is_active
        target_user.updated_at = datetime.now(timezone.utc)

        # Audit log
        audit = AuditLog(
            actor_id=admin.id,
            action="USER_STATUS_CHANGE",
            target_user_id=target_user.id,
            details=json.dumps({"previous_active": prev_status, "new_active": is_active}),
        )
        db.add(audit)
        db.commit()
        db.refresh(target_user)
        return target_user

    def reset_user_password(self, db: Session, admin: User, user_id: str, new_password: str) -> None:
        """Reset a user's password without ever exposing or storing plaintext."""
        target_user = db.query(User).filter(User.id == user_id).first()
        if not target_user:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found.")

        target_user.password_hash = get_password_hash(new_password)
        target_user.updated_at = datetime.now(timezone.utc)

        audit = AuditLog(
            actor_id=admin.id,
            action="ADMIN_PASSWORD_RESET",
            target_user_id=target_user.id,
            details=json.dumps({"info": "Password reset executed by administrator"}),
        )
        db.add(audit)
        db.commit()

    def adjust_virtual_capital(self, db: Session, admin: User, req: CapitalAdjustmentRequest) -> LedgerTransaction:
        """Authorized virtual capital adjustment (credit or debit) with required audit record."""
        target_user = db.query(User).filter(User.id == req.target_user_id).first()
        if not target_user:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Target user not found.")

        account = db.query(Account).filter(Account.user_id == target_user.id).first()
        if not account:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User account not found.")

        new_balance = account.cash_balance + req.amount
        if new_balance < 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Adjustment would result in negative cash balance ({new_balance:.2f}).",
            )

        account.cash_balance = new_balance
        account.updated_at = datetime.now(timezone.utc)

        # Record Ledger Transaction (marked is_external_flow = True so it does NOT inflate return %)
        ledger_tx = LedgerTransaction(
            user_id=target_user.id,
            type="ADMIN_ADJUSTMENT",
            amount=req.amount,
            balance_after=new_balance,
            description=f"Admin Capital Adjustment: {req.reason}",
            is_external_flow=True,
            created_at=datetime.now(timezone.utc),
        )
        db.add(ledger_tx)

        # Audit log for system integrity
        audit = AuditLog(
            actor_id=admin.id,
            action="VIRTUAL_CAPITAL_ADJUSTMENT",
            target_user_id=target_user.id,
            details=json.dumps({
                "amount": req.amount,
                "reason": req.reason,
                "resulting_balance": new_balance,
            }),
        )
        db.add(audit)
        db.commit()
        db.refresh(ledger_tx)
        return ledger_tx

    def get_audit_logs(self, db: Session, admin: User, limit: int = 100) -> List[AuditLogOut]:
        """Fetch platform audit logs."""
        logs = db.query(AuditLog).order_by(AuditLog.created_at.desc()).limit(limit).all()
        result = []
        for l in logs:
            actor = db.query(User).filter(User.id == l.actor_id).first() if l.actor_id else None
            target = db.query(User).filter(User.id == l.target_user_id).first() if l.target_user_id else None
            result.append(AuditLogOut(
                id=l.id,
                actor_id=l.actor_id,
                actor_username=actor.username if actor else "SYSTEM",
                action=l.action,
                target_user_id=l.target_user_id,
                target_username=target.username if target else None,
                details=l.details,
                created_at=l.created_at,
            ))
        return result


admin_service = AdminService()
