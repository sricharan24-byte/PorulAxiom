# Decisions

## Locked

- Realistic paper trading is primary; virtual cash and competition are additive.
- Only `USER` and one `ADMIN` exist; no new admin can be created.
- Admin can manage access/credentials and inspect portfolios, holdings, orders, trades, and timestamps, but cannot view passwords or alter/cancel/delete/execute orders or trades.
- Financial admin actions changing net worth are user-visible; other admin activity need not be.
- History is immutable and auditable.
- Friends-only leaderboard ranks percentage return, not net worth.
- External capital adjustments are excluded from trading-performance gain.
- Supabase/PostgreSQL is authoritative; secrets and market keys stay server-side.
- Modular monolith; avoid unnecessary infrastructure.

## Selected technologies

Next.js/React, FastAPI/Python, Supabase/PostgreSQL, Google OAuth plus local credentials, REST/WebSocket, Render engine hosting, and Cloudflare frontend hosting.

## Still provisional

Upstox is a candidate until API availability, entitlement, pricing, rate-limit, and WebSocket behavior are validated. Detailed Google onboarding/recovery and production service limits also need validation.
