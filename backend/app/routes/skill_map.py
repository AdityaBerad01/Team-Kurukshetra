"""
Campus Skill Map Routes for PeerConnect.
"""
from flask import Blueprint, request
from app.services import skill_map_service
from app.utils.responses import success_response

skill_map_bp = Blueprint("skill_map", __name__)


@skill_map_bp.route("/campus-skill-map", methods=["GET"])
def get_campus_skill_map_route():
    """
    Publicly retrieve privacy-safe aggregated campus skill demand vs tutor supply data.
    """
    campus = request.args.get("campus", "").strip() or None
    data = skill_map_service.get_campus_skill_map(campus=campus)
    return success_response(data=data, message="Campus skill map retrieved successfully.")
