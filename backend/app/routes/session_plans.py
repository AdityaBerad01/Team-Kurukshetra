"""
Smart Session Planner & Confidence Tracker Routes for PeerConnect.
"""
from flask import Blueprint, request
from flask_jwt_extended import get_jwt_identity, jwt_required

from app.services import session_plan_service
from app.utils.responses import error_response, success_response

session_plans_bp = Blueprint("session_plans", __name__)


@session_plans_bp.route("/requests/<request_id>/plan", methods=["GET"])
@jwt_required()
def get_session_plan_route(request_id: str):
    """
    Retrieve or initialize the structured plan and confidence ratings for a session.
    """
    user_id = get_jwt_identity()
    plan, err_msg, status_code = session_plan_service.get_or_create_plan(user_id, request_id)
    if err_msg:
        return error_response(message=err_msg, status_code=status_code)

    return success_response(data=plan, message="Session plan retrieved.")


@session_plans_bp.route("/requests/<request_id>/plan", methods=["PUT"])
@jwt_required()
def update_session_plan_route(request_id: str):
    """
    Update session objectives, difficult concepts, agenda items, and tasks.
    """
    user_id = get_jwt_identity()
    data = request.get_json() or {}

    plan, err_msg, status_code = session_plan_service.update_plan(user_id, request_id, data)
    if err_msg:
        return error_response(message=err_msg, status_code=status_code)

    return success_response(data=plan, message="Session plan updated.")


@session_plans_bp.route("/requests/<request_id>/confidence", methods=["POST"])
@jwt_required()
def record_confidence_route(request_id: str):
    """
    Student rates self-confidence (1 to 5) before or after tutoring.
    """
    user_id = get_jwt_identity()
    data = request.get_json() or {}

    plan, err_msg, status_code = session_plan_service.record_confidence(user_id, request_id, data)
    if err_msg:
        return error_response(message=err_msg, status_code=status_code)

    return success_response(data=plan, message="Confidence rating recorded.")


@session_plans_bp.route("/confidence/my-trends", methods=["GET"])
@jwt_required()
def get_confidence_trends_route():
    """
    Retrieve student's confidence progress trends across completed tutoring sessions.
    """
    user_id = get_jwt_identity()
    trends = session_plan_service.get_student_confidence_trends(user_id)
    return success_response(data=trends, message="Confidence trends retrieved.")
