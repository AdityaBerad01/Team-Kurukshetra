"""
Pytest fixtures shared across all tests.
"""
import pytest
from app import create_app
from app.extensions import mongo


@pytest.fixture()
def app():
    """Create a Flask app configured for testing."""
    test_config = {
        "TESTING": True,
        "MONGO_URI": "mongodb://127.0.0.1:27017/peerconnect_test",
        "JWT_SECRET_KEY": "test-jwt-secret-key-must-be-at-least-32-chars-long",
        "SECRET_KEY": "test-flask-secret-key-at-least-32-chars",
    }
    application = create_app(config_overrides=test_config)

    # Clean test collections before yielding
    with application.app_context():
        try:
            mongo.db.users.delete_many({})
            mongo.db.tutor_profiles.delete_many({})
            mongo.db.availability.delete_many({})
            mongo.db.session_requests.delete_many({})
        except Exception:
            pass

    yield application

    # Clean test collections after test finishes
    with application.app_context():
        try:
            mongo.db.users.delete_many({})
            mongo.db.tutor_profiles.delete_many({})
            mongo.db.availability.delete_many({})
            mongo.db.session_requests.delete_many({})
        except Exception:
            pass


@pytest.fixture()
def client(app):
    """A test client for the app."""
    return app.test_client()


@pytest.fixture()
def runner(app):
    """A test CLI runner for the app."""
    return app.test_cli_runner()


@pytest.fixture()
def tutor_token(client):
    """Register and login a tutor, returning (token, user_dict)."""
    reg_resp = client.post(
        "/api/auth/register",
        json={
            "name": "Dr. Raman",
            "email": "raman@tutor.edu",
            "password": "Password123!",
            "role": "TUTOR",
            "university": "IISc Bangalore",
        },
    )
    assert reg_resp.status_code == 201

    login_resp = client.post(
        "/api/auth/login",
        json={"email": "raman@tutor.edu", "password": "Password123!"},
    )
    assert login_resp.status_code == 200
    data = login_resp.get_json()["data"]
    return data["access_token"], data["user"]


@pytest.fixture()
def student_token(client):
    """Register and login a student, returning (token, user_dict)."""
    reg_resp = client.post(
        "/api/auth/register",
        json={
            "name": "Aarav Gupta",
            "email": "aarav@student.edu",
            "password": "Password123!",
            "role": "STUDENT",
            "university": "Delhi University",
        },
    )
    assert reg_resp.status_code == 201

    login_resp = client.post(
        "/api/auth/login",
        json={"email": "aarav@student.edu", "password": "Password123!"},
    )
    assert login_resp.status_code == 200
    data = login_resp.get_json()["data"]
    return data["access_token"], data["user"]
