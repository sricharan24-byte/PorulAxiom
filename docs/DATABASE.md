# Database design

Supabase-hosted PostgreSQL is the authoritative persistent store. The browser, caches, and market feed never replace it for balances, holdings, access, or performance.

## Planned domains

- identities, roles, credentials, sessions, and access state
- cash accounts and virtual-capital adjustments
- instruments and timestamped market observations where needed
- orders, trades, holdings, portfolios, and performance
- friend requests and friendships
- user-visible financial events and internal audit records

## Invariants

- Exactly one principal has `ADMIN`; all others are `USER`.
- Orders and trades are append-only. Corrections are new linked events, not updates/deletes.
- Cash, holdings, trade execution, and audit events commit transactionally.
- Deposits, withdrawals, and admin adjustments are external cash flows, stored separately and neutralized in return calculations.
- Financial and administrative events retain actor and timestamp data.
- Password hashes are never returned from the API or admin UI.

Versioned schema changes will live in `database/migrations/`; do not apply unreviewed schema changes directly to production.
