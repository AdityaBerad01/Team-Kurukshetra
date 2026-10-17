"""
Dashboard routes for PeerConnect.
Provides real-time personalized analytics and statistics for authenticated students and tutors.
"""
from flask import Blueprint
from flask_jwt_extended import get_jwt_identity, jwt_required

from app.services import dashboard_service
from app.utils.responses import error_response, success_response

dashboard_bp = Blueprint("dashboard", __name__)


@dashboard_bp.route("/student", methods=["GET"])
@jwt_required()
def get_student_dashboard_stats():
    """
    Retrieve personalized dashboard metrics and recent activity for the authenticated student.
    """
    user_id = get_jwt_identity()
    data, err_msg, status_code = dashboard_service.get_student_dashboard(user_id)
    if err_msg:
        return error_response(message=err_msg, status_code=status_code)

    return success_response(data=data, message="Student dashboard data retrieved successfully.")


@dashboard_bp.route("/tutor", methods=["GET"])
@jwt_required()
def get_tutor_dashboard_stats():
    """
    Retrieve personalized dashboard metrics, available slots, and rating for the authenticated tutor.
    """
    user_id = get_jwt_identity()
    data, err_msg, status_code = dashboard_service.get_tutor_dashboard(user_id)
    if err_msg:
        return error_response(message=err_msg, status_code=status_code)

    return success_response(data=data, message="Tutor dashboard data retrieved successfully.")
