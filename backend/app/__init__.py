"""
Application factory for PeerConnect Flask backend.
"""
import os
from flask import Flask
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from dotenv import load_dotenv

from app.extensions import mongo, jwt
from app.routes.health import health_bp


def create_app(config_overrides: dict | None = None) -> Flask:
    """Create and configure the Flask application."""

    # Load environment variables from .env (if present)
    load_dotenv()

    app = Flask(__name__)

    # ------------------------------------------------------------------ #
    #  Core configuration                                                  #
    # ------------------------------------------------------------------ #
    app.config["SECRET_KEY"] = os.environ.get("SECRET_KEY", "dev-secret-change-me")
    app.config["JWT_SECRET_KEY"] = os.environ.get("JWT_SECRET_KEY", "dev-jwt-change-me")
    app.config["MONGO_URI"] = os.environ.get("MONGO_URI", "mongodb://127.0.0.1:27017/peerconnect")

    if config_overrides:
        app.config.update(config_overrides)

    # ------------------------------------------------------------------ #
    #  Extensions                                                          #
    # ------------------------------------------------------------------ #
    # CORS – allow only the configured frontend origin
    frontend_origin = os.environ.get("FRONTEND_ORIGIN", "http://localhost:5173")
    CORS(app, resources={r"/api/*": {"origins": frontend_origin}})

    jwt.init_app(app)

    # MongoDB via PyMongo
    mongo.init_app(app)

    # ------------------------------------------------------------------ #
    #  Blueprints                                                          #
    # ------------------------------------------------------------------ #
    app.register_blueprint(health_bp, url_prefix="/api")
    from app.routes.auth import auth_bp
    app.register_blueprint(auth_bp, url_prefix="/api/auth")
    from app.routes.tutors import tutors_bp
    app.register_blueprint(tutors_bp, url_prefix="/api/tutors")
    from app.routes.slots import slots_bp
    app.register_blueprint(slots_bp, url_prefix="/api/slots")
    from app.routes.requests import requests_bp
    app.register_blueprint(requests_bp, url_prefix="/api/requests")
    from app.routes.reviews import reviews_bp
    app.register_blueprint(reviews_bp, url_prefix="/api")
    from app.routes.dashboard import dashboard_bp
    app.register_blueprint(dashboard_bp, url_prefix="/api/dashboard")

    return app
