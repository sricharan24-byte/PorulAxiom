"""Tests for Return Calculation Neutrality against Capital Adjustments."""

def test_capital_adjustment_does_not_inflate_return_percentage(client):
    # 1. Login as user and check baseline return
    u_login = client.post(
        "/api/auth/login",
        json={"username_or_email": "trader_raj", "password": "TraderPass123!"},
    )
    u_token = u_login.json()["access_token"]
    u_headers = {"Authorization": f"Bearer {u_token}"}

    summary_before = client.get("/api/portfolio/summary", headers=u_headers).json()
    assert summary_before["return_percentage"] == 0.0
    assert summary_before["net_worth"] == 1000000.0

    # 2. Admin injects ₹500,000 capital into trader_raj's account
    a_login = client.post(
        "/api/auth/login",
        json={"username_or_email": "admin", "password": "AdminPass123!"},
    )
    a_token = a_login.json()["access_token"]
    a_headers = {"Authorization": f"Bearer {a_token}"}

    client.post(
        "/api/admin/capital-adjust",
        headers=a_headers,
        json={
            "target_user_id": "b0000000-0000-0000-0000-000000000001",
            "amount": 500000.0,
            "reason": "Test capital grant",
        },
    )

    # 3. User checks portfolio again
    summary_after = client.get("/api/portfolio/summary", headers=u_headers).json()
    # Net worth must have increased to ₹1,500,000
    assert summary_after["net_worth"] == 1500000.0
    # BUT return_percentage MUST STILL BE 0.0% (NOT +50%)!
    assert summary_after["return_percentage"] == 0.0

    # 4. Check Leaderboard: User should still have 0.0% return
    board_res = client.get("/api/friends/leaderboard", headers=u_headers)
    assert board_res.status_code == 200
    board = board_res.json()
    raj_entry = next(item for item in board if item["username"] == "trader_raj")
    assert raj_entry["return_percentage"] == 0.0
