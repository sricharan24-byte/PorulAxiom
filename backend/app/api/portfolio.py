"""Portfolio and Holdings API routes."""

from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_current_active_user
from app.models.user import User
from app.schemas.portfolio import HoldingOut, PortfolioSummary
from app.services.portfolio_service import portfolio_service

router = APIRouter(prefix="/api/portfolio", tags=["portfolio"])


@router.get("/summary", response_model=PortfolioSummary)
def get_portfolio_summary(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """Retrieve full portfolio valuation, P&L, holdings, and return percentage."""
    return portfolio_service.get_portfolio_summary(db, current_user)


@router.get("/holdings", response_model=List[HoldingOut])
def get_holdings(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """Retrieve active stock holdings."""
    summary = portfolio_service.get_portfolio_summary(db, current_user)
    return summary.holdings
