"""
Health check route – GET /api/health
"""
from flask import Blueprint, jsonify
from datetime import datetime, timezone

health_bp = Blueprint("health", __name__)


@health_bp.get("/health")
def health_check():
    """Returns service status and UTC timestamp."""
    return jsonify(
        {
            "status": "ok",
            "service": "PeerConnect API",
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }
    ), 200
