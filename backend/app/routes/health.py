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
    Verifies API process liveness and reports MongoDB status.
    Returns HTTP 200 to satisfy cloud platform health probes (Render, Railway).
    """
    from app.extensions import mongo
    db_status = "ok"

    try:
        # Ping with short timeout so health probe never blocks or hangs
        mongo.db.command("ping", maxTimeMS=2000)
    except Exception as e:
        db_status = f"unhealthy: {str(e)}"

    return jsonify(
        {
            "status": "ok",
            "service": "PeerConnect API",
            "database": db_status,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }
    ), 200
