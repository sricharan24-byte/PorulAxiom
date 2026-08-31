-- ==============================================================================
-- PorulAxiom Seed Data
-- ==============================================================================

-- 1. Insert Market Instruments
INSERT INTO market_instruments (symbol, name, exchange, sector, base_price, currency, is_tradable)
VALUES
    ('RELIANCE', 'Reliance Industries Ltd', 'NSE', 'Energy & Conglomerate', 2950.00, 'INR', true),
    ('TCS', 'Tata Consultancy Services Ltd', 'NSE', 'Technology', 4120.00, 'INR', true),
    ('INFY', 'Infosys Ltd', 'NSE', 'Technology', 1880.00, 'INR', true),
    ('HDFCBANK', 'HDFC Bank Ltd', 'NSE', 'Banking & Finance', 1650.00, 'INR', true),
    ('TATAMOTORS', 'Tata Motors Ltd', 'NSE', 'Automotive', 1040.00, 'INR', true),
    ('ICICIBANK', 'ICICI Bank Ltd', 'NSE', 'Banking & Finance', 1230.00, 'INR', true),
    ('SBIN', 'State Bank of India', 'NSE', 'Banking & Finance', 815.00, 'INR', true),
    ('AAPL', 'Apple Inc', 'NASDAQ', 'Technology', 225.00, 'USD', true),
    ('NVDA', 'NVIDIA Corporation', 'NASDAQ', 'Semiconductors', 128.00, 'USD', true),
    ('TSLA', 'Tesla Inc', 'NASDAQ', 'Automotive & Clean Tech', 215.00, 'USD', true),
    ('MSFT', 'Microsoft Corporation', 'NASDAQ', 'Technology', 448.00, 'USD', true),
    ('GOOGL', 'Alphabet Inc', 'NASDAQ', 'Technology', 182.00, 'USD', true)
ON CONFLICT (symbol) DO NOTHING;

-- 2. Insert Default Admin User (Password is 'AdminPass123!')
INSERT INTO users (id, email, username, password_hash, role, is_active)
VALUES (
    'a0000000-0000-0000-0000-000000000001',
    'admin@porulaxiom.local',
    'admin',
    '$2b$12$kE6Avo1Rf96VuQB1pj9AGuU1c5sn4.AIa1jm.RkIGeeWUVTEmAjfi',
    'ADMIN',
    true
)
ON CONFLICT (id) DO UPDATE SET password_hash = EXCLUDED.password_hash;

-- 3. Insert Demo Trader Mokshit (Password is 'TraderPass123!')
INSERT INTO users (id, email, username, password_hash, role, is_active)
VALUES (
    'b0000000-0000-0000-0000-000000000001',
    'mokshit@porulaxiom.local',
    'trader_mokshit',
    '$2b$12$0D951T9OWCaN9lkbfSiyGOuqYrrdRTwbtzgjLDPoWliu1shsxEsZm',
    'USER',
    true
)
ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email, username = EXCLUDED.username, password_hash = EXCLUDED.password_hash;

-- Account for Trader Mokshit (1,000,000 INR starting capital)
INSERT INTO accounts (id, user_id, cash_balance, currency)
VALUES (
    'c0000000-0000-0000-0000-000000000001',
    'b0000000-0000-0000-0000-000000000001',
    1000000.0000,
    'INR'
)
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO ledger_transactions (id, user_id, type, amount, balance_after, description, is_external_flow)
VALUES (
    'd0000000-0000-0000-0000-000000000001',
    'b0000000-0000-0000-0000-000000000001',
    'INITIAL_GRANT',
    1000000.0000,
    1000000.0000,
    'Initial paper trading virtual balance grant',
    true
)
ON CONFLICT DO NOTHING;
