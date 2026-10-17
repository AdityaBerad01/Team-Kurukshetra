"""
Session request routes for PeerConnect.
Handles booking requests, listing student requests, incoming tutor requests,
and status transitions (accept, decline, cancel).
"""
from flask import Blueprint, request
from flask_jwt_extended import get_jwt_identity, jwt_required

from app.services import session_request_service
from app.utils.responses import error_response, success_response

requests_bp = Blueprint("requests", __name__)


@requests_bp.route("", methods=["POST"])
@jwt_required()
def create_session_request():
    """
    Create a new tutoring session request from an authenticated student.
    """
    user_id = get_jwt_identity()
    data = request.get_json() or {}

    req, err_msg, status_code = session_request_service.create_request(user_id, data)
    if err_msg:
        return error_response(message=err_msg, status_code=status_code)

    return success_response(data=req, message="Tutoring session request submitted successfully.", status_code=201)


@requests_bp.route("/my", methods=["GET"])
@jwt_required()
def get_my_requests():
    """
    Retrieve all session requests submitted by the authenticated student.
    """
    user_id = get_jwt_identity()
    requests_list = session_request_service.get_student_requests(user_id)
    return success_response(data=requests_list, message="Student session requests retrieved.")


@requests_bp.route("/incoming", methods=["GET"])
@jwt_required()
def get_incoming_requests():
    """
    Retrieve all incoming session requests for the authenticated tutor.
    """
    user_id = get_jwt_identity()
    requests_list = session_request_service.get_tutor_incoming_requests(user_id)
    return success_response(data=requests_list, message="Incoming tutor session requests retrieved.")


@requests_bp.route("/<request_id>/accept", methods=["PATCH"])
@jwt_required()
def accept_request(request_id: str):
    """
    Tutor accepts a pending session request and atomically locks the slot.
    """
    user_id = get_jwt_identity()

    req, err_msg, status_code = session_request_service.accept_request(user_id, request_id)
    if err_msg:
        return error_response(message=err_msg, status_code=status_code)

    return success_response(data=req, message="Session request accepted and slot confirmed.")


@requests_bp.route("/<request_id>/decline", methods=["PATCH"])
@jwt_required()
def decline_request(request_id: str):
    """
    Tutor declines a pending session request.
    """
    user_id = get_jwt_identity()

    req, err_msg, status_code = session_request_service.decline_request(user_id, request_id)
    if err_msg:
        return error_response(message=err_msg, status_code=status_code)

    return success_response(data=req, message="Session request declined.")


@requests_bp.route("/<request_id>/cancel", methods=["PATCH"])
@jwt_required()
def cancel_request(request_id: str):
    """
    Student cancels their own pending or accepted session request.
    If accepted, the slot is released back to available.
    """
    user_id = get_jwt_identity()

    req, err_msg, status_code = session_request_service.cancel_request(user_id, request_id)
    if err_msg:
        return error_response(message=err_msg, status_code=status_code)

    return success_response(data=req, message="Session request cancelled.")


@requests_bp.route("/<request_id>/complete", methods=["PATCH"])
@jwt_required()
def complete_session_request(request_id: str):
    """
    Mark an accepted session as completed (accessible to student or tutor).
    """
    user_id = get_jwt_identity()

    req, err_msg, status_code = session_request_service.complete_request(user_id, request_id)
    if err_msg:
        return error_response(message=err_msg, status_code=status_code)

    return success_response(data=req, message="Session marked as completed.")


@requests_bp.route("/<request_id>", methods=["GET"])
@jwt_required()
def get_session_request_details(request_id: str):
    """
    Get detailed information about a single session request for participants.
    """
    user_id = get_jwt_identity()

    req, err_msg, status_code = session_request_service.get_request_by_id(user_id, request_id)
    if err_msg:
        return error_response(message=err_msg, status_code=status_code)

    return success_response(data=req, message="Session request details retrieved.")


@requests_bp.route("/<request_id>/backup-tutors", methods=["GET"])
@jwt_required()
def get_backup_tutors(request_id: str):
    """
    Retrieve smart backup tutor recommendations when a session is declined or cancelled.
    """
    user_id = get_jwt_identity()
    from app.services.backup_tutor_service import get_backup_tutors_for_request

    data, err_msg, status_code = get_backup_tutors_for_request(user_id, request_id)
    if err_msg:
        return error_response(message=err_msg, status_code=status_code)

    return success_response(data=data, message="Backup tutor recommendations retrieved.")
