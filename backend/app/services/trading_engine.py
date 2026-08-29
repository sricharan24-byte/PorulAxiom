"""Atomic transactional trading execution engine."""

import logging
from datetime import datetime, timezone
from typing import Optional, Tuple
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.account import Account
from app.models.holding import Holding
from app.models.instrument import MarketInstrument
from app.models.ledger import LedgerTransaction
from app.models.order import Order
from app.models.trade import Trade
from app.models.user import User
from app.schemas.order import OrderCreate
from app.services.market_service import market_service

logger = logging.getLogger(__name__)


class TradingEngine:
    """Handles order placement, atomic validation, trade execution, and ledger entries."""

    def place_order(self, db: Session, user: User, order_in: OrderCreate) -> Order:
        """Atomically validate and execute or queue an order."""
        # 1. Validate Instrument
        instrument = db.query(MarketInstrument).filter(MarketInstrument.symbol == order_in.symbol).first()
        if not instrument or not instrument.is_tradable:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Instrument {order_in.symbol} is not valid or not tradable.",
            )

        # 2. Fetch User Account
        account = db.query(Account).filter(Account.user_id == user.id).first()
        if not account:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Trading account not found for user.",
            )

        # 3. Get Current Market Price
        quote = market_service.get_quote(db, order_in.symbol)
        if not quote:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Market quote currently unavailable for instrument.",
            )

        market_price = quote.price
        target_price = order_in.price if order_in.order_type == "LIMIT" and order_in.price else market_price

        # 4. Validate order parameters
        if order_in.quantity <= 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Quantity must be strictly positive.",
            )

        # 5. Check Execution Readiness (Market vs Limit Trigger)
        can_execute_now = False
        execution_price = market_price

        if order_in.order_type == "MARKET":
            can_execute_now = True
            execution_price = market_price
        elif order_in.order_type == "LIMIT":
            if order_in.side == "BUY" and target_price >= market_price:
                can_execute_now = True
                execution_price = target_price
            elif order_in.side == "SELL" and target_price <= market_price:
                can_execute_now = True
                execution_price = target_price

        # 6. Pre-trade Validation (Cash for BUY, Holdings for SELL)
        if order_in.side == "BUY":
            required_funds = target_price * order_in.quantity
            if account.cash_balance < required_funds:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Insufficient cash balance. Required: {required_funds:.2f}, Available: {account.cash_balance:.2f}",
                )
        elif order_in.side == "SELL":
            holding = db.query(Holding).filter(
                Holding.account_id == account.id,
                Holding.symbol == order_in.symbol,
            ).first()
            if not holding or holding.quantity < order_in.quantity:
                avail_qty = holding.quantity if holding else 0.0
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Insufficient shares to sell. Required: {order_in.quantity}, Owned: {avail_qty}",
                )

        # 7. Create Order Record
        order = Order(
            user_id=user.id,
            symbol=order_in.symbol,
            side=order_in.side,
            order_type=order_in.order_type,
            price=target_price,
            quantity=order_in.quantity,
            filled_quantity=order_in.quantity if can_execute_now else 0.0,
            status="FILLED" if can_execute_now else "PENDING",
            created_at=datetime.now(timezone.utc),
        )
        db.add(order)
        db.flush()

        # 8. Execute Trade if immediately executable
        if can_execute_now:
            self._execute_trade(db, user, account, order, execution_price)

        db.commit()
        db.refresh(order)
        return order

    def _execute_trade(self, db: Session, user: User, account: Account, order: Order, executed_price: float) -> Trade:
        """Perform atomic trade execution, balance deduction/credit, and ledger record."""
        total_trade_amount = executed_price * order.quantity

        # Create Trade record
        trade = Trade(
            order_id=order.id,
            user_id=user.id,
            symbol=order.symbol,
            side=order.side,
            quantity=order.quantity,
            executed_price=executed_price,
            executed_at=datetime.now(timezone.utc),
        )
        db.add(trade)

        # Update Account & Holdings
        if order.side == "BUY":
            account.cash_balance -= total_trade_amount
            # Upsert Holding
            holding = db.query(Holding).filter(
                Holding.account_id == account.id,
                Holding.symbol == order.symbol,
            ).first()

            if holding:
                total_shares = holding.quantity + order.quantity
                weighted_cost = (holding.quantity * holding.average_buy_price) + total_trade_amount
                holding.average_buy_price = round(weighted_cost / total_shares, 4)
                holding.quantity = total_shares
                holding.updated_at = datetime.now(timezone.utc)
            else:
                holding = Holding(
                    account_id=account.id,
                    symbol=order.symbol,
                    quantity=order.quantity,
                    average_buy_price=executed_price,
                )
                db.add(holding)

            # Record Ledger Transaction
            ledger_entry = LedgerTransaction(
                user_id=user.id,
                type="TRADE_DEBIT",
                amount=-total_trade_amount,
                balance_after=account.cash_balance,
                description=f"Bought {order.quantity} {order.symbol} @ {executed_price:.2f}",
                is_external_flow=False,
            )
            db.add(ledger_entry)

        elif order.side == "SELL":
            account.cash_balance += total_trade_amount
            holding = db.query(Holding).filter(
                Holding.account_id == account.id,
                Holding.symbol == order.symbol,
            ).first()

            if holding:
                holding.quantity -= order.quantity
                holding.updated_at = datetime.now(timezone.utc)
                if holding.quantity <= 0:
                    db.delete(holding)

            # Record Ledger Transaction
            ledger_entry = LedgerTransaction(
                user_id=user.id,
                type="TRADE_CREDIT",
                amount=total_trade_amount,
                balance_after=account.cash_balance,
                description=f"Sold {order.quantity} {order.symbol} @ {executed_price:.2f}",
                is_external_flow=False,
            )
            db.add(ledger_entry)

        return trade

    def cancel_order(self, db: Session, user: User, order_id: str) -> Order:
        """Allow the order owner to cancel their own PENDING order."""
        order = db.query(Order).filter(Order.id == order_id).first()
        if not order:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Order not found.",
            )

        # STRICT INVARIANT: Only the owning user can cancel their order. Admin CANNOT cancel.
        if order.user_id != user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You cannot cancel an order belonging to another user.",
            )

        if order.status != "PENDING":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Cannot cancel order with status '{order.status}'. Only PENDING orders can be cancelled.",
            )

        order.status = "CANCELLED"
        order.updated_at = datetime.now(timezone.utc)
        db.commit()
        db.refresh(order)
        return order


trading_engine = TradingEngine()
