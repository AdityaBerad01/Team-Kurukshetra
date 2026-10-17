"""
Tests for Authentication Endpoints.
"""


def test_auth_register_success(client):
    resp = client.post(
        "/api/auth/register",
        json={
            "name": "Kavita Rao",
            "email": "kavita@university.edu",
            "password": "SecurePassword123!",
            "role": "STUDENT",
        },
    )
    assert resp.status_code == 201
    data = resp.get_json()
    assert data["success"] is True
    assert data["data"]["name"] == "Kavita Rao"
    assert data["data"]["email"] == "kavita@university.edu"
    assert "password_hash" not in data["data"]


def test_auth_duplicate_email_rejected(client):
    payload = {
        "name": "Kavita Rao",
        "email": "duplicate@university.edu",
        "password": "SecurePassword123!",
        "role": "STUDENT",
    }
    resp1 = client.post("/api/auth/register", json=payload)
    assert resp1.status_code == 201

    resp2 = client.post("/api/auth/register", json=payload)
    assert resp2.status_code == 409
    assert resp2.get_json()["success"] is False


def test_auth_login_success(client):
    client.post(
        "/api/auth/register",
        json={
            "name": "Login User",
            "email": "login@university.edu",
            "password": "Password123!",
            "role": "TUTOR",
        },
    )
    resp = client.post(
        "/api/auth/login",
        json={"email": "login@university.edu", "password": "Password123!"},
    )
    assert resp.status_code == 200
    data = resp.get_json()["data"]
    assert "access_token" in data
    assert data["user"]["email"] == "login@university.edu"
    assert "password_hash" not in data["user"]


def test_auth_login_invalid_password(client):
    client.post(
        "/api/auth/register",
        json={
            "name": "Wrong Pass User",
            "email": "wrongpass@university.edu",
            "password": "RealPassword123!",
            "role": "STUDENT",
        },
    )
    resp = client.post(
        "/api/auth/login",
        json={"email": "wrongpass@university.edu", "password": "IncorrectPassword!"},
    )
    assert resp.status_code == 401
    assert resp.get_json()["success"] is False


def test_auth_me_protected(client):
    # Without token
    resp1 = client.get("/api/auth/me")
    assert resp1.status_code == 401

    # With valid token
    client.post(
        "/api/auth/register",
        json={
            "name": "Me User",
            "email": "me@university.edu",
            "password": "Password123!",
            "role": "STUDENT",
        },
    )
    login_data = client.post(
        "/api/auth/login",
        json={"email": "me@university.edu", "password": "Password123!"},
    ).get_json()["data"]

    token = login_data["access_token"]
    resp2 = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert resp2.status_code == 200
    assert resp2.get_json()["data"]["email"] == "me@university.edu"
