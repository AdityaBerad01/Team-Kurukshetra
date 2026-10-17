"""
Application factory for PeerConnect Flask backend.
Configured for development and production WSGI deployments.
"""
import logging
import os
from urllib.parse import urlparse, urlunparse
from dotenv import load_dotenv
from flask import Flask
from flask_cors import CORS

from app.extensions import mongo, jwt
from app.routes.health import health_bp


def init_db_indexes(app: Flask):
    """Ensure essential collection indexes are present on startup asynchronously."""
    import threading

    def _create_indexes():
        with app.app_context():
            try:
                mongo.db.users.create_index("email", unique=True)
                mongo.db.tutor_profiles.create_index("user_id", unique=True)
                mongo.db.tutor_profiles.create_index("subjects")
                mongo.db.tutor_profiles.create_index("teaching_modes")
                mongo.db.availability.create_index([("tutor_id", 1), ("date", 1), ("status", 1)])
                mongo.db.availability.create_index([("status", 1), ("date", 1)])
                mongo.db.session_requests.create_index([("student_id", 1), ("created_at", -1)])
                mongo.db.session_requests.create_index([("tutor_id", 1), ("status", 1)])
                mongo.db.session_requests.create_index([("slot_id", 1), ("status", 1)])
                mongo.db.reviews.create_index([("request_id", 1)], unique=True)
                mongo.db.reviews.create_index([("tutor_id", 1), ("created_at", -1)])
                mongo.db.reviews.create_index([("student_id", 1), ("created_at", -1)])
                mongo.db.credit_transactions.create_index([("user_id", 1), ("created_at", -1)])
                mongo.db.credit_transactions.create_index([("related_session_id", 1), ("type", 1)])
                mongo.db.assessments.create_index([("student_id", 1), ("status", 1)])
                mongo.db.assessments.create_index([("tutor_id", 1), ("created_at", -1)])
                mongo.db.resources.create_index([("subject", 1), ("upvotes", -1)])
                mongo.db.resources.create_index([("author_id", 1)])
                mongo.db.focus_rooms.create_index([("status", 1), ("expires_at", 1)])
                mongo.db.focus_sprints.create_index([("user_id", 1), ("completed_at", -1)])
                mongo.db.session_plans.create_index([("request_id", 1)], unique=True)
                mongo.db.portfolios.create_index([("user_id", 1)], unique=True)
            except Exception as e:
                app.logger.warning("MongoDB index initialization note: %s", e)

    threading.Thread(target=_create_indexes, daemon=True).start()


def create_app(config_overrides: dict | None = None) -> Flask:
    """Create and configure the Flask application."""

    # Load environment variables from .env (if present)
    load_dotenv()

    app = Flask(__name__)

    # ------------------------------------------------------------------ #
    #  Core configuration & Production defaults                          #
    # ------------------------------------------------------------------ #
    is_debug = os.environ.get("FLASK_DEBUG", "0").lower() in ("1", "true")
    flask_env = os.environ.get("FLASK_ENV", "production" if not is_debug else "development")

    app.config["ENV"] = flask_env
    app.config["DEBUG"] = is_debug
    app.config["SECRET_KEY"] = os.environ.get("SECRET_KEY", "dev-secret-change-me")
    app.config["JWT_SECRET_KEY"] = os.environ.get("JWT_SECRET_KEY", "dev-jwt-change-me")

    # Logging setup
    log_level = logging.DEBUG if is_debug else logging.INFO
    logging.basicConfig(
        level=log_level,
        format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    )

    # MongoDB URI and optional explicit database name override
    mongo_uri = os.environ.get("MONGO_URI", "mongodb://127.0.0.1:27017/peerconnect")
    db_name = os.environ.get("MONGO_DB_NAME")
    if db_name:
        try:
            parsed = urlparse(mongo_uri)
            new_path = f"/{db_name.strip('/')}"
            mongo_uri = urlunparse((parsed.scheme, parsed.netloc, new_path, parsed.params, parsed.query, parsed.fragment))
        except Exception as e:
            app.logger.warning("Could not apply MONGO_DB_NAME to MONGO_URI: %s", e)
    app.config["MONGO_URI"] = mongo_uri

    if config_overrides:
        app.config.update(config_overrides)

    # ------------------------------------------------------------------ #
    #  Extensions & CORS                                                 #
    # ------------------------------------------------------------------ #
    # CORS – allow configured frontend origins (supports comma-separated list)
    raw_origins = os.environ.get("FRONTEND_ORIGIN", "http://localhost:5173,http://127.0.0.1:5173")
    frontend_origins = [o.strip() for o in raw_origins.split(",") if o.strip()]
    CORS(app, resources={r"/api/*": {"origins": frontend_origins}})

    jwt.init_app(app)

    # MongoDB via PyMongo – guard against missing/bad URI so startup never hangs
    try:
        mongo.init_app(app)
    except Exception as exc:  # pragma: no cover
        app.logger.error("MongoDB init failed (MONGO_URI may not be set): %s", exc)

    # Initialize collection indexes (runs in background thread – safe to fail)
    init_db_indexes(app)

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
    from app.routes.credits import credits_bp
    app.register_blueprint(credits_bp, url_prefix="/api/credits")
    from app.routes.assessments import assessments_bp
    app.register_blueprint(assessments_bp, url_prefix="/api/assessments")
    from app.routes.resources import resources_bp
    app.register_blueprint(resources_bp, url_prefix="/api/resources")
    from app.routes.focus import focus_bp
    app.register_blueprint(focus_bp, url_prefix="/api/focus")
    from app.routes.session_plans import session_plans_bp
    app.register_blueprint(session_plans_bp, url_prefix="/api")
    from app.routes.skill_map import skill_map_bp
    app.register_blueprint(skill_map_bp, url_prefix="/api")
    from app.routes.portfolio import portfolio_bp
    app.register_blueprint(portfolio_bp, url_prefix="/api/portfolio")

    # ------------------------------------------------------------------ #
    #  Frontend Static Serving (Single-origin production hosting)         #
    # ------------------------------------------------------------------ #
    dist_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "frontend", "dist"))
    if os.path.isdir(dist_dir):
        from flask import send_from_directory

        @app.route("/", defaults={"path": ""})
        @app.route("/<path:path>")
        def serve_frontend(path):
            if path.startswith("api/") or path == "api":
                from app.utils.responses import error_response
                return error_response(message="Resource not found.", status_code=404)
            if path and os.path.exists(os.path.join(dist_dir, path)):
                return send_from_directory(dist_dir, path)
            return send_from_directory(dist_dir, "index.html")

    # ------------------------------------------------------------------ #
    #  Global Error Handlers                                               #
    # ------------------------------------------------------------------ #
    from app.utils.responses import error_response

    @app.errorhandler(404)
    def handle_404(e):
        from flask import request
        if request.path.startswith("/api"):
            return error_response(message="Resource not found.", status_code=404)
        if os.path.isdir(dist_dir):
            from flask import send_from_directory
            return send_from_directory(dist_dir, "index.html")
        return error_response(message="Resource not found.", status_code=404)

    @app.errorhandler(405)
    def handle_405(e):
        return error_response(message="Method not allowed.", status_code=405)

    @app.errorhandler(500)
    def handle_500(e):
        app.logger.error("Internal Server Error: %s", e)
        return error_response(message="An internal server error occurred.", status_code=500)

    return app
