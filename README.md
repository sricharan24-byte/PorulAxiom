# PorulAxiom

PorulAxiom is a realistic virtual stock-market and paper-trading platform. It uses real market data while keeping trading virtual. Virtual cash and friends-only competition support the core trading experience.

## Status

This is the project foundation: documentation, directory structure, ignore rules, and environment examples. No trading features are implemented.

## Selected stack

- Next.js + React frontend, targeted for Cloudflare
- Python + FastAPI engine, targeted for Render
- Supabase PostgreSQL cloud database
- Google OAuth onboarding plus local username/password credentials
- REST and WebSocket communication
- Upstox as a provisional market-data candidate

## Layout

- `docs/`: product and technical documentation
- `frontend/`: future Next.js app
- `backend/`: future FastAPI modular monolith
- `database/`: future migrations and seed data

Read [AGENTS.md](AGENTS.md) and the documents in `docs/` before implementation.

## Next implementation chunk

Stage 1 now provides a dependency-free FastAPI health endpoint and a minimal Next.js page that checks it. It does not implement trading, identity, database, or market-data features.

## Run locally

In one terminal:

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements-dev.txt
uvicorn app.main:app --reload
```

In another terminal:

```powershell
cd frontend
npm install
npm run dev
```

Open `http://localhost:3000`. The page reports whether the engine at `http://localhost:8000/health` is reachable.
