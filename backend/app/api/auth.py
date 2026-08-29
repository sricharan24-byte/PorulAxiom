"""Authentication API routes."""

from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.core.database import get_db
from app.core.deps import get_current_active_user
from app.core.security import create_access_token, get_password_hash, verify_password
from app.models.account import Account
from app.models.ledger import LedgerTransaction
from app.models.user import User
from app.schemas.auth import Token, UserLogin, UserOut, UserRegister

router = APIRouter(prefix="/api/auth", tags=["auth"])
settings = get_settings()


@router.post("/register", response_model=Token, status_code=status.HTTP_201_CREATED)
def register(user_in: UserRegister, db: Session = Depends(get_db)):
    """Register a new user with standard USER role and initial paper balance."""
    # Check if username or email already exists
    existing_user = db.query(User).filter((User.email == user_in.email) | (User.username == user_in.username)).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username or email already registered.",
        )

    # Invariant: Registered users ALWAYS get 'USER' role
    new_user = User(
        email=user_in.email,
        username=user_in.username,
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
        user_id=new_user.id,
    )


@router.post("/login", response_model=Token)
def login(login_in: UserLogin, db: Session = Depends(get_db)):
    """Authenticate user with username/email and password."""
    user = db.query(User).filter(
        (User.email == login_in.username_or_email) | (User.username == login_in.username_or_email)
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
        user_id=user.id,
    )


@router.get("/me", response_model=UserOut)
def get_me(current_user: User = Depends(get_current_active_user)):
    """Return the currently authenticated user."""
    return current_user


@router.post("/demo-login/{demo_type}", response_model=Token)
def demo_login(demo_type: str, db: Session = Depends(get_db)):
    """Quick 1-click login for demonstration: 'admin', 'trader1', or 'trader2'."""
    target_username = "admin" if demo_type == "admin" else ("trader_priya" if demo_type == "trader2" else "trader_raj")
    user = db.query(User).filter(User.username == target_username).first()

    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Demo account not found.")

    token = create_access_token(user.id)
    return Token(
        access_token=token,
        token_type="bearer",
        role=user.role,
        username=user.username,
        user_id=user.id,
    )
