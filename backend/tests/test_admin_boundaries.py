"""Tests for Admin role boundaries, audit log generation, and order immutability."""

def test_admin_cannot_cancel_user_orders(client):
    # 1. User creates a pending limit order
    u_login = client.post(
        "/api/auth/login",
        json={"username_or_email": "trader_mokshit", "password": "TraderPass123!"},
    )
    u_token = u_login.json()["access_token"]
    u_headers = {"Authorization": f"Bearer {u_token}"}

    order_res = client.post(
        "/api/orders",
        headers=u_headers,
        json={"symbol": "RELIANCE", "side": "BUY", "order_type": "LIMIT", "quantity": 5, "price": 500.0},
    )
    order_id = order_res.json()["id"]

    # 2. Admin logs in and attempts to cancel the user's order
    a_login = client.post(
        "/api/auth/login",
        json={"username_or_email": "admin", "password": "AdminPass123!"},
    )
    a_token = a_login.json()["access_token"]
    a_headers = {"Authorization": f"Bearer {a_token}"}

    cancel_res = client.delete(f"/api/orders/{order_id}", headers=a_headers)
    # MUST FAIL with 403 Forbidden
    assert cancel_res.status_code == 403
    assert "cannot cancel an order belonging to another user" in cancel_res.json()["detail"]


def test_admin_capital_adjustment_creates_audit_log_and_ledger(client):
    # Admin logs in
    a_login = client.post(
        "/api/auth/login",
        json={"username_or_email": "admin", "password": "AdminPass123!"},
    )
    a_token = a_login.json()["access_token"]
    a_headers = {"Authorization": f"Bearer {a_token}"}

    # Perform capital adjustment of +₹200,000 for trader_mokshit
    adjust_res = client.post(
        "/api/admin/capital-adjust",
        headers=a_headers,
        json={
            "target_user_id": "b0000000-0000-0000-0000-000000000001",
            "amount": 200000.0,
            "reason": "Authorized paper tournament reward grant",
        },
    )
    assert adjust_res.status_code == 200
    assert adjust_res.json()["is_external_flow"] is True

    # Verify audit log was recorded
    audit_res = client.get("/api/admin/audit-logs", headers=a_headers)
    assert audit_res.status_code == 200
    logs = audit_res.json()
    assert len(logs) > 0
    assert logs[0]["action"] == "VIRTUAL_CAPITAL_ADJUSTMENT"
