"""Portfolio valuation and external-cash-flow-neutral return calculation."""

from typing import List, Optional
from sqlalchemy.orm import Session

from app.models.account import Account
from app.models.holding import Holding
from app.models.ledger import LedgerTransaction
from app.models.user import User
from app.schemas.portfolio import HoldingOut, PortfolioSummary
from app.services.market_service import market_service


class PortfolioService:
    """Calculates real-time portfolio value, P&L, and neutralized return percentage."""

    def get_portfolio_summary(self, db: Session, user: User) -> PortfolioSummary:
        """Return full portfolio valuation, holdings, and return percentage."""
        account = db.query(Account).filter(Account.user_id == user.id).first()
        if not account:
            return PortfolioSummary(
                cash_balance=0.0,
                invested_value=0.0,
                current_holdings_value=0.0,
                net_worth=0.0,
                total_unrealized_pnl=0.0,
                total_realized_pnl=0.0,
                total_pnl=0.0,
                return_percentage=0.0,
                currency="INR",
                holdings=[],
            )

        holdings_records = db.query(Holding).filter(Holding.account_id == account.id).all()
        holdings_out: List[HoldingOut] = []

        total_invested_val = 0.0
        total_current_holdings_val = 0.0
        total_unrealized_pnl = 0.0

        for h in holdings_records:
            quote = market_service.get_quote(db, h.symbol)
            curr_price = quote.price if quote else h.average_buy_price
            name = quote.name if quote else h.symbol

            invested = round(h.quantity * h.average_buy_price, 2)
            curr_val = round(h.quantity * curr_price, 2)
            unrealized = round(curr_val - invested, 2)
            unrealized_pct = round((unrealized / invested) * 100, 2) if invested > 0 else 0.0

            total_invested_val += invested
            total_current_holdings_val += curr_val
            total_unrealized_pnl += unrealized

            holdings_out.append(HoldingOut(
                id=h.id,
                symbol=h.symbol,
                name=name,
                quantity=h.quantity,
                average_buy_price=h.average_buy_price,
                current_price=curr_price,
                current_value=curr_val,
                invested_value=invested,
                unrealized_pnl=unrealized,
                unrealized_pnl_percent=unrealized_pct,
                currency=account.currency,
            ))

        net_worth = round(account.cash_balance + total_current_holdings_val, 2)

        # ----------------------------------------------------------------------
        # RETURN CALCULATION (Neutralizing External Cash Flows)
        # ----------------------------------------------------------------------
        # Total external capital = Sum of all INITIAL_GRANT & ADMIN_ADJUSTMENT transactions
        external_transactions = db.query(LedgerTransaction).filter(
            LedgerTransaction.user_id == user.id,
            LedgerTransaction.is_external_flow == True,
        ).all()

        net_external_capital = sum(tx.amount for tx in external_transactions)
        if net_external_capital <= 0:
            net_external_capital = 1_000_000.0  # Fallback default baseline

        trading_gain = net_worth - net_external_capital
        return_pct = round((trading_gain / net_external_capital) * 100, 2)

        return PortfolioSummary(
            cash_balance=round(account.cash_balance, 2),
            invested_value=round(total_invested_val, 2),
            current_holdings_value=round(total_current_holdings_val, 2),
            net_worth=net_worth,
            total_unrealized_pnl=round(total_unrealized_pnl, 2),
            total_realized_pnl=0.0,
            total_pnl=round(total_unrealized_pnl, 2),
            return_percentage=return_pct,
            currency=account.currency,
            holdings=holdings_out,
        )

    def get_user_return_percentage(self, db: Session, user: User) -> float:
        """Lightweight calculation of return percentage for leaderboards."""
        summary = self.get_portfolio_summary(db, user)
        return summary.return_percentage


portfolio_service = PortfolioService()
