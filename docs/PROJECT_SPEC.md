# Project specification

## Purpose

PorulAxiom enables realistic, simulated stock trading using virtual money and real market data. Simulation fidelity, traceable financial state, and fair performance measurement are central.

## Core experience

1. A person completes Google OAuth onboarding and establishes application username/password credentials.
2. They access the same cloud-backed account across devices.
3. They place simulated orders using real market data.
4. The engine validates and records actions under explicit market and simulation rules.
5. They compare percentage return only with accepted friends.

## Roles and invariants

There are only `USER` and exactly one `ADMIN` roles. Admin can manage access, reset/change credentials without seeing passwords, view portfolios/holdings/orders/trades/timestamps, and make authorized capital adjustments. Admin cannot modify, delete, cancel, or execute orders or trades.

Orders, executions, and financial adjustments are auditable. History is immutable; corrections are new linked records. Capital adjustments are external cash flows and cannot improve investment performance. Financial actions that change net worth must be visible to the affected user; routine admin activity does not require notice.
