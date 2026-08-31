"""Authentication API routes."""

import logging
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.core.database import get_db
from app.core.deps import get_current_active_user
from app.core.security import create_access_token, get_password_hash, verify_password
from app.models.account import Account
from app.models.ledger import LedgerTransaction
from app.models.user import User
from app.schemas.auth import Token, UserLogin, UserOut, UserRegister

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/auth", tags=["auth"])
settings = get_settings()


@router.post("/register", response_model=Token, status_code=status.HTTP_201_CREATED)
def register(user_in: UserRegister, db: Session = Depends(get_db)):
    """Register a new user with standard USER role and initial paper balance."""
    try:
        email_clean = user_in.email.strip().lower()
        username_clean = user_in.username.strip()

        # Check if username or email already exists
        existing_user = db.query(User).filter(
            (func.lower(User.email) == email_clean) | (func.lower(User.username) == username_clean.lower())
        ).first()

        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Username or email already registered.",
            )

        # Invariant: Registered users ALWAYS get 'USER' role
        new_user = User(
            email=email_clean,
            username=username_clean,
            password_hash=get_password_hash(user_in.password),
            role="USER",
            is_active=True,
        )
        db.add(new_user)
        db.flush()

        # Create virtual cash trading account
        account = Account(
            user_id=new_user.id,
            cash_balance=settings.initial_paper_balance,
            currency="INR",
        )
        db.add(account)

        # Record Initial Capital Grant in Ledger
        ledger_entry = LedgerTransaction(
            user_id=new_user.id,
            type="INITIAL_GRANT",
            amount=settings.initial_paper_balance,
            balance_after=settings.initial_paper_balance,
            description="Initial paper trading virtual balance grant",
            is_external_flow=True,
        )
        db.add(ledger_entry)

        db.commit()
        db.refresh(new_user)

        token = create_access_token(new_user.id)
        return Token(
            access_token=token,
            token_type="bearer",
            role=new_user.role,
            username=new_user.username,
            user_id=str(new_user.id),
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Unhandled exception in registration: %s", e, exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Registration Error: {str(e)}",
        )


@router.post("/login", response_model=Token)
def login(login_in: UserLogin, db: Session = Depends(get_db)):
    """Authenticate user with username/email and password."""
    try:
        identifier = login_in.username_or_email.strip().lower()
        user = db.query(User).filter(
            (func.lower(User.email) == identifier) | (func.lower(User.username) == identifier)
        ).first()

        if not user or not verify_password(login_in.password, user.password_hash):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid username/email or password.",
            )

        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Account is inactive or suspended. Please contact the administrator.",
            )

        token = create_access_token(user.id)
        return Token(
            access_token=token,
            token_type="bearer",
            role=user.role,
            username=user.username,
            user_id=str(user.id),
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Unhandled exception in login: %s", e, exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Login Error: {str(e)}",
        )


@router.get("/me", response_model=UserOut)
def get_me(current_user: User = Depends(get_current_active_user)):
    """Return the currently authenticated user."""
    return current_user


@router.post("/demo-login/{demo_type}", response_model=Token)
def demo_login(demo_type: str, db: Session = Depends(get_db)):
    """Quick 1-click login for demonstration: 'admin' or 'trader'."""
    try:
        target_username = "admin" if demo_type == "admin" else "trader_mokshit"
        user = db.query(User).filter(func.lower(User.username) == target_username.lower()).first()

        if not user:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Demo account not found.")

        token = create_access_token(user.id)
        return Token(
            access_token=token,
            token_type="bearer",
            role=user.role,
            username=user.username,
            user_id=str(user.id),
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Unhandled exception in demo login: %s", e, exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Demo Login Error: {str(e)}",
        )
