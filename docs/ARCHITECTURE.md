# Architecture

PorulAxiom is a modular monolith. One FastAPI engine owns authorization, business rules, provider access, and persistent-state changes. A Next.js frontend is a separate client and never contains privileged credentials.

## Boundaries

- Frontend: Next.js/React, targeted for Cloudflare, uses REST and WebSocket.
- Engine: FastAPI/Python, targeted for Render, validates requests and owns transactions/audits.
- Data: Supabase PostgreSQL is the authoritative store for state and history.
- Market adapter: isolates the provisional provider, currently Upstox, from trading logic.

The frontend cannot calculate authoritative balances, permissions, execution, or returns. Render and Cloudflare plans must be validated before production; constraints must not reduce trading correctness.
