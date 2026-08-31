# PorulAxiom Production Deployment Guide

This guide details how to deploy the PorulAxiom paper trading platform across **Supabase** (Database), **Render** (FastAPI Engine), and **Vercel** (Next.js Frontend).

---

## Step 1: Database Setup on Supabase

1. **Create Supabase Project**:
   - Log in to [Supabase](https://supabase.com) and create a new project (e.g. `porulaxiom-db`).
   - Note down your database password.

2. **Run Migrations & Seeds**:
   - In your Supabase project dashboard, open the **SQL Editor**.
   - Copy and execute the contents of [`database/migrations/001_initial_schema.sql`](database/migrations/001_initial_schema.sql).
   - Copy and execute the contents of [`database/seeds/001_seed_data.sql`](database/seeds/001_seed_data.sql).

3. **Obtain Connection String**:
   - Go to **Project Settings** → **Database** → **Connection string** (URI).
   - Example format:
     ```
     postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
     ```

---

## Step 2: Backend API Deployment on Render

1. **Create Web Service on Render**:
   - Log in to [Render](https://render.com) and click **New +** → **Web Service**.
   - Connect your GitHub repository.
   - Set **Root Directory** to `backend`.
   - **Runtime**: `Python 3` (or choose Docker using `backend/Dockerfile`).
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
   - **Health Check Path**: `/health`

2. **Configure Environment Variables**:
   Add the following environment variables in the Render dashboard:
   - `APP_ENV`: `production`
   - `APP_SECRET_KEY`: `(Generate a 32+ character random secret)`
   - `DATABASE_URL`: `postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres`
   - `FRONTEND_ORIGIN`: `https://your-porulaxiom.vercel.app` (or `*` during initial testing)
   - `MARKET_DATA_PROVIDER`: `simulation` (or `upstox` when credentials are added)

3. **Deploy & Verify**:
   - Click **Create Web Service**.
   - Once deployed, visit `https://your-service.onrender.com/health`.
   - Expected response:
     ```json
     {"status": "ok", "service": "porulaxiom-engine", "version": "1.0.0"}
     ```

---

## Step 3: Frontend Deployment on Vercel

1. **Import Project to Vercel**:
   - Log in to [Vercel](https://vercel.com) and click **Add New...** → **Project**.
   - Select your repository.
   - Set **Root Directory** to `frontend`.
   - Framework Preset will be automatically detected as **Next.js**.

2. **Configure Environment Variables**:
   Add the following environment variable in Vercel:
   - `NEXT_PUBLIC_API_BASE_URL`: `https://your-service.onrender.com` (Your deployed Render backend URL)

3. **Deploy & Test**:
   - Click **Deploy**.
   - Visit your Vercel deployment URL (e.g. `https://porulaxiom.vercel.app`).

---

## Default Seed Credentials

- **Sole Administrator**:
  - Username: `admin` / Email: `admin@porulaxiom.local`
  - Password: `AdminPass123!`
- **Demo Trader (Mokshit)**:
  - Username: `trader_mokshit` / Email: `mokshit@porulaxiom.local`
  - Password: `TraderPass123!`
  - Initial Capital: ₹10,00,000.00
