# PorulAxiom — Project Context

## Purpose

PorulAxiom is a realistic virtual stock-market and paper-trading platform. Users trade with virtual money using real market data. Realistic trading simulation is the core product; virtual cash and friend competition are supporting features.

## Current stack

- Frontend: Next.js + React
- Backend engine: Python + FastAPI
- Database: Supabase-hosted PostgreSQL
- Frontend hosting target: Cloudflare
- Backend hosting target: Render
- Authentication: Google OAuth for onboarding plus local username/password credentials for normal sign-in
- Communication: REST APIs and WebSockets
- Market data: Upstox is the current candidate, but remains provisional until its API, entitlements, limits, and streaming behavior are validated.

## Architecture

Build this as a modular monolith.

- The Next.js frontend is the user/admin interface.
- The FastAPI engine owns all business rules, authorization, trading logic, market-provider access, and financial-state changes.
- Supabase/PostgreSQL is the authoritative source of truth.
- The frontend must never contain database credentials, market API keys, OAuth secrets, or other privileged secrets.
- Do not introduce microservices, Redis, Docker, Kubernetes, or extra infrastructure unless a real requirement requires them.

## Roles

Exactly two roles exist:

1. `USER`
2. `ADMIN`

There must be exactly one `ADMIN` account. No registration flow, API endpoint, database migration, or administrative action may create another admin.

## Admin permissions

The single admin may:

- Manage user account access, including activation or deactivation.
- Reset or change a user's password without viewing it.
- View user portfolios, holdings, orders, trades, account activity, and associated timestamps.
- Make authorized virtual-capital adjustments.
- View audit information needed to operate the platform.

The admin must never:

- View a user's password.
- Modify, delete, cancel, or execute a user's order or trade.
- Directly manipulate trading history or positions.

Passwords must only be stored as secure, salted, non-reversible hashes.

## Trading and audit rules

- Orders, trades, cash movements, and administrative financial adjustments must be auditable.
- Trading history is immutable and append-only.
- Never “fix” a historical trade by editing or deleting it. Use a new, linked correction or compensating record when necessary.
- The engine, never the browser, validates cash, holdings, order rules, account access, market status, and price rules.
- Financial state changes must be transactional and consistent across devices.
- Do not manufacture a price if market data is stale, unavailable, or the market is closed.

## User visibility

Users do not need to receive general notifications about ordinary admin activity.

However, any administrative or financial event that changes a user's net worth must be visible to that affected user with enough detail to understand the change.

## Performance and leaderboard rules

- The leaderboard is friends-only. There is no global leaderboard in v1.
- Rank users by percentage return, never by absolute net worth.
- Capital deposits, withdrawals, and admin virtual-capital adjustments are external cash flows.
- External cash flows must be recorded separately and must not artificially improve a user's trading performance or leaderboard rank.
- Define and test the exact return calculation before releasing the leaderboard.

## Authentication direction

- Google OAuth is used for initial account onboarding.
- Users then establish application-controlled username/password credentials for routine login.
- The same account must work across devices.
- Final account-linking, recovery, duplicate-account, session, and token details require security review before implementation.

## Engineering rules

- Never commit secrets, `.env` files, tokens, passwords, API keys, service-role keys, or production database URLs.
- Keep market-provider credentials server-side.
- Prefer tests, explicit validation, logging without sensitive data, and incremental vertical slices.
- Preserve existing files and decisions unless a change is explicitly requested.
- Update project documentation when changing a product rule, data invariant, external integration, or deployment assumption.

## Development roadmap

1. Foundation: frontend/backend health check, local configuration, tests.
2. Database and identity: schema, secure credentials, exactly-one-admin enforcement.
3. Market data: validate provider and build a server-side adapter.
4. Trading: immutable order/trade flow, simulated execution, cash and holdings.
5. Portfolio: valuation, P&L, and return calculation.
6. Friends and leaderboard: friendships plus percentage-return rankings.
7. Admin controls: bounded user management, capital adjustments, audit records.
8. Hardening and deployment: security, tests, Supabase, Render, and Cloudflare validation.

## Current status

The project foundation exists. Do not implement trading, authentication, database, or market-data features unless the requested task explicitly moves to that stage.