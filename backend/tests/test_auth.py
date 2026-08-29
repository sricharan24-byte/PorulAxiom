"""Tests for Authentication, Registration, and JWT verification."""

def test_user_registration_and_initial_grant(client):
    response = client.post(
        "/api/auth/register",
        json={"email": "newuser@example.com", "username": "newuser", "password": "SecurePassword123!"},
    )
    assert response.status_code == 201
    data = response.json()
    assert data["role"] == "USER"
    assert data["username"] == "newuser"
    assert "access_token" in data


def test_user_login_success(client):
    response = client.post(
        "/api/auth/login",
        json={"username_or_email": "admin", "password": "AdminPass123!"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["role"] == "ADMIN"


def test_user_login_invalid_password(client):
    response = client.post(
        "/api/auth/login",
        json={"username_or_email": "admin", "password": "WrongPassword!"},
    )
    assert response.status_code == 401
