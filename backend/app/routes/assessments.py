"""
Assessment and Learning Progress routes for PeerConnect.
"""
from flask import Blueprint, request
from flask_jwt_extended import get_jwt_identity, jwt_required

from app.services import assessment_service
from app.utils.responses import error_response, success_response

assessments_bp = Blueprint("assessments", __name__)


@assessments_bp.route("", methods=["POST"])
@jwt_required()
def create_assessment_route():
    """
    Tutor creates a diagnostic or evaluation assessment for a student.
    """
    user_id = get_jwt_identity()
    data = request.get_json() or {}

    assessment, err_msg, status_code = assessment_service.create_assessment(user_id, data)
    if err_msg:
        return error_response(message=err_msg, status_code=status_code)

    return success_response(data=assessment, message="Assessment created successfully.", status_code=201)


@assessments_bp.route("/my", methods=["GET"])
@jwt_required()
def get_my_assessments():
    """
    Retrieve all assessments authored by or assigned to the current user.
    """
    user_id = get_jwt_identity()
    assessments_list = assessment_service.get_user_assessments(user_id)
    return success_response(data=assessments_list, message="Assessments retrieved successfully.")


@assessments_bp.route("/<assessment_id>/submit", methods=["POST"])
@jwt_required()
def submit_assessment_route(assessment_id: str):
    """
    Student submits answers to an assigned assessment.
    """
    user_id = get_jwt_identity()
    data = request.get_json() or {}
    answers = data.get("answers", {})

    result, err_msg, status_code = assessment_service.submit_assessment(user_id, assessment_id, answers)
    if err_msg:
        return error_response(message=err_msg, status_code=status_code)

    return success_response(data=result, message="Assessment submitted and scored successfully.")


@assessments_bp.route("/progress", methods=["GET"])
@jwt_required()
def get_progress():
    """
    Retrieve structured learning progress analytics, topic proficiencies, and milestones.
    """
    user_id = get_jwt_identity()
    progress_data = assessment_service.get_progress_summary(user_id)
    return success_response(data=progress_data, message="Learning progress summary retrieved.")
