"""
Pytest fixtures shared across all tests.
"""
import pytest
from app import create_app


@pytest.fixture()
def app():
    """Create a Flask app configured for testing (no real DB needed)."""
    test_config = {
        "TESTING": True,
        "MONGO_URI": "mongodb://localhost:27017/peerconnect_test",
        "JWT_SECRET_KEY": "test-jwt-secret",
        "SECRET_KEY": "test-secret",
    }
    application = create_app(config_overrides=test_config)
    yield application


@pytest.fixture()
def client(app):
    """A test client for the app."""
    return app.test_client()


@pytest.fixture()
def runner(app):
    """A test CLI runner for the app."""
    return app.test_cli_runner()
