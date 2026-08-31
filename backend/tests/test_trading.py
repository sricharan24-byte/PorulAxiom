"""Tests for Order Placement, Trade Execution, and Holdings Updates."""

def test_market_buy_and_sell_cycle(client):
    # Login as trader_mokshit
    login_res = client.post(
        "/api/auth/login",
        json={"username_or_email": "trader_mokshit", "password": "TraderPass123!"},
    )
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 1. Check Initial Balance
    portfolio_res = client.get("/api/portfolio/summary", headers=headers)
    assert portfolio_res.status_code == 200
    init_cash = portfolio_res.json()["cash_balance"]
    assert init_cash == 1000000.0

    # 2. Place Market BUY Order for 10 shares of RELIANCE
    order_res = client.post(
        "/api/orders",
        headers=headers,
        json={"symbol": "RELIANCE", "side": "BUY", "order_type": "MARKET", "quantity": 10},
    )
    assert order_res.status_code == 201
    order_data = order_res.json()
    assert order_data["status"] == "FILLED"
    assert order_data["filled_quantity"] == 10

    # 3. Check Holdings
    holdings_res = client.get("/api/portfolio/holdings", headers=headers)
    assert holdings_res.status_code == 200
    holdings = holdings_res.json()
    assert len(holdings) == 1
    assert holdings[0]["symbol"] == "RELIANCE"
    assert holdings[0]["quantity"] == 10

    # 4. Check Cash was deducted
    portfolio_after_buy = client.get("/api/portfolio/summary", headers=headers).json()
    assert portfolio_after_buy["cash_balance"] < init_cash

    # 5. Place Market SELL Order for 5 shares
    sell_res = client.post(
        "/api/orders",
        headers=headers,
        json={"symbol": "RELIANCE", "side": "SELL", "order_type": "MARKET", "quantity": 5},
    )
    assert sell_res.status_code == 201
    assert sell_res.json()["status"] == "FILLED"

    # 6. Check Holdings reduced to 5
    holdings_res2 = client.get("/api/portfolio/holdings", headers=headers).json()
    assert holdings_res2[0]["quantity"] == 5


def test_insufficient_funds_rejection(client):
    login_res = client.post(
        "/api/auth/login",
        json={"username_or_email": "trader_mokshit", "password": "TraderPass123!"},
    )
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Attempt to buy 10,000 shares of TCS (~41 million INR, exceeding 1M balance)
    res = client.post(
        "/api/orders",
        headers=headers,
        json={"symbol": "TCS", "side": "BUY", "order_type": "MARKET", "quantity": 10000},
    )
    assert res.status_code == 400
    assert "Insufficient cash balance" in res.json()["detail"]


def test_limit_order_placement_and_cancellation(client):
    login_res = client.post(
        "/api/auth/login",
        json={"username_or_email": "trader_mokshit", "password": "TraderPass123!"},
    )
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Place a BUY Limit order with a price way below market (e.g. 500 INR for RELIANCE)
    limit_res = client.post(
        "/api/orders",
        headers=headers,
        json={"symbol": "RELIANCE", "side": "BUY", "order_type": "LIMIT", "quantity": 5, "price": 500.0},
    )
    assert limit_res.status_code == 201
    order = limit_res.json()
    assert order["status"] == "PENDING"

    # User cancels order
    cancel_res = client.delete(f"/api/orders/{order['id']}", headers=headers)
    assert cancel_res.status_code == 200
    assert cancel_res.json()["status"] == "CANCELLED"
