-- ==============================================================================
-- PorulAxiom Database Schema (v1.0.0)
-- Target: Supabase PostgreSQL (also compatible with standard PostgreSQL)
-- ==============================================================================

-- Enable UUID extension if not present
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Users Table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'USER' CHECK (role IN ('USER', 'ADMIN')),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- INVARIANT: Exactly one ADMIN account in the entire system
CREATE UNIQUE INDEX IF NOT EXISTS idx_single_admin ON users (role) WHERE role = 'ADMIN';

-- 2. Accounts (Virtual Cash Balance) Table
CREATE TABLE IF NOT EXISTS accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    cash_balance NUMERIC(18, 4) NOT NULL DEFAULT 1000000.0000 CHECK (cash_balance >= 0),
    currency VARCHAR(10) NOT NULL DEFAULT 'INR',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Market Instruments Table
CREATE TABLE IF NOT EXISTS market_instruments (
    symbol VARCHAR(30) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    exchange VARCHAR(50) NOT NULL DEFAULT 'NSE',
    sector VARCHAR(100) NOT NULL,
    base_price NUMERIC(18, 4) NOT NULL,
    currency VARCHAR(10) NOT NULL DEFAULT 'INR',
    is_tradable BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Holdings Table
CREATE TABLE IF NOT EXISTS holdings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    symbol VARCHAR(30) NOT NULL REFERENCES market_instruments(symbol),
    quantity NUMERIC(18, 4) NOT NULL DEFAULT 0 CHECK (quantity >= 0),
    average_buy_price NUMERIC(18, 4) NOT NULL DEFAULT 0 CHECK (average_buy_price >= 0),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_account_symbol UNIQUE (account_id, symbol)
);

-- 5. Orders Table (Immutable Record)
CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    symbol VARCHAR(30) NOT NULL REFERENCES market_instruments(symbol),
    side VARCHAR(10) NOT NULL CHECK (side IN ('BUY', 'SELL')),
    order_type VARCHAR(10) NOT NULL CHECK (order_type IN ('MARKET', 'LIMIT')),
    price NUMERIC(18, 4) NOT NULL CHECK (price > 0),
    quantity NUMERIC(18, 4) NOT NULL CHECK (quantity > 0),
    filled_quantity NUMERIC(18, 4) NOT NULL DEFAULT 0 CHECK (filled_quantity >= 0),
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'FILLED', 'PARTIALLY_FILLED', 'CANCELLED', 'REJECTED')),
    rejection_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. Trades Table (Immutable Execution Record)
CREATE TABLE IF NOT EXISTS trades (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE RESTRICT,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    symbol VARCHAR(30) NOT NULL REFERENCES market_instruments(symbol),
    side VARCHAR(10) NOT NULL CHECK (side IN ('BUY', 'SELL')),
    quantity NUMERIC(18, 4) NOT NULL CHECK (quantity > 0),
    executed_price NUMERIC(18, 4) NOT NULL CHECK (executed_price > 0),
    executed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 7. Ledger Transactions Table (Immutable Cash Movements)
CREATE TABLE IF NOT EXISTS ledger_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    type VARCHAR(50) NOT NULL CHECK (type IN ('INITIAL_GRANT', 'TRADE_DEBIT', 'TRADE_CREDIT', 'ADMIN_ADJUSTMENT')),
    amount NUMERIC(18, 4) NOT NULL, -- Positive for credit, negative for debit
    balance_after NUMERIC(18, 4) NOT NULL CHECK (balance_after >= 0),
    description TEXT NOT NULL,
    is_external_flow BOOLEAN NOT NULL DEFAULT FALSE, -- Must be TRUE for grants/adjustments to neutralize return %
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 8. Friendships Table (Social Graph)
CREATE TABLE IF NOT EXISTS friendships (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    requester_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    addressee_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'ACCEPTED', 'REJECTED', 'BLOCKED')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_friend_pair UNIQUE (requester_id, addressee_id),
    CONSTRAINT check_not_self_friend CHECK (requester_id <> addressee_id)
);

-- 9. Audit Logs Table (Admin Activity & System Integrity)
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    actor_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    target_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    details JSONB NOT NULL DEFAULT '{}'::jsonb,
    ip_address VARCHAR(45),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performant querying
CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_trades_user ON trades(user_id, executed_at DESC);
CREATE INDEX IF NOT EXISTS idx_ledger_user ON ledger_transactions(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_actor ON audit_logs(actor_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_friendships_users ON friendships(requester_id, addressee_id);
