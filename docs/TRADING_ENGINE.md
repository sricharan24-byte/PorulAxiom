# Trading engine

The FastAPI engine will validate user intent, apply explicit simulation/market rules, write financial state atomically, and preserve an audit trail.

## Non-negotiable behavior

- Only a user can initiate their own order through permitted API flows.
- Admin cannot modify, delete, cancel, or execute any user order or trade.
- Orders, trades, and ledger events are immutable. Corrections are new linked records.
- The engine validates cash, holdings, access, instruments, market state, and pricing; the browser is never authoritative.
- State changes carry timestamps and actor/context records and are transactionally consistent across devices.

## Accounting and performance

Net worth is cash plus holdings under approved valuation rules. Investment return measures trading performance, not absolute wealth. Deposits, withdrawals, and admin capital adjustments are external cash flows: record them separately and neutralize them in percentage-return calculations so added capital cannot raise leaderboard rank.

Before implementation, define order types/states, market-hours and quote-freshness rules, execution-price rules, and the precise return methodology. Test concurrent requests, insufficient funds/holdings, stale data, and immutable-admin boundaries.
