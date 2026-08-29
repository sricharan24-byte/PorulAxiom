# PorulAxiom project rules

This repository is the source of truth. Read this file and every document in `docs/` before making product or architecture decisions. Preserve existing work and make small, reviewable changes.

## Non-negotiable rules

- Realistic paper trading is the core product; virtual cash and competition are additions.
- Only `USER` and `ADMIN` roles exist, and exactly one account may be `ADMIN`. No flow may create another admin.
- Admin may manage access, reset/change credentials, view portfolios, holdings, orders, trades, and timestamps, and make authorized virtual-capital adjustments.
- Admin may never view passwords or modify, delete, cancel, or execute a user's order or trade.
- Orders, trades, and financial history are immutable and auditable.
- General admin activity need not be shown to users. A financial/admin action changing net worth must be visible to the affected user.
- Leaderboards are friends-only and rank percentage return, never net worth. Capital adjustments must not improve return.
- Supabase/PostgreSQL is authoritative for multi-device access. Market keys stay server-side. Never commit secrets.

## Architecture

- Build a modular monolith, not microservices.
- Use Next.js + React, Python + FastAPI, Supabase/PostgreSQL, REST + WebSocket, Render for the engine, and Cloudflare for the frontend.
- Google OAuth supports onboarding; application credentials support normal username/password sign-in.
- Upstox is only a provisional market-data candidate until validated.
- Prefer correctness, authorization, auditability, and tests over extra infrastructure or UI polish.
