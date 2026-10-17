"""
Health check route – GET /api/health
Deployment-ready health endpoint with MongoDB ping check.
"""
from flask import Blueprint, jsonify
from datetime import datetime, timezone

health_bp = Blueprint("health", __name__)


@health_bp.get("/health")
def health_check():
    """
    Deployment health check endpoint.
    Verifies API process liveness and MongoDB connectivity.
    Returns HTTP 200 when healthy, HTTP 503 when database is unreachable.
    """
    from app.extensions import mongo
    db_status = "ok"
    status_code = 200

    try:
        # Ping MongoDB database
        mongo.db.command("ping")
    except Exception as e:
        db_status = f"unhealthy: {str(e)}"
        status_code = 503

    return jsonify(
        {
            "status": "ok" if status_code == 200 else "degraded",
            "service": "PeerConnect API",
            "database": db_status,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }
    ), status_code
