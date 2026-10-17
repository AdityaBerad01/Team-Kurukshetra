"""
Tutor routes for PeerConnect.
Handles tutor profile creation, editing, discovery, search, and details.
"""
import math
from flask import Blueprint, request
from flask_jwt_extended import get_jwt_identity, jwt_required

from app.services import tutor_service
from app.utils.responses import error_response, success_response

tutors_bp = Blueprint("tutors", __name__)


@tutors_bp.route("/profile", methods=["POST"])
@jwt_required()
def create_my_profile():
    """
    Create a tutor profile for the authenticated user.
    Only users with role TUTOR can create a profile.
    """
    user_id = get_jwt_identity()
    data = request.get_json() or {}

    profile, err_msg, status_code = tutor_service.create_profile(user_id, data)
    if err_msg:
        return error_response(message=err_msg, status_code=status_code)

    return success_response(
        data=profile,
        message="Tutor profile created successfully.",
        status_code=201,
    )


@tutors_bp.route("/profile/me", methods=["GET"])
@jwt_required()
def get_my_profile():
    """
    Retrieve the authenticated tutor's own profile.
    """
    user_id = get_jwt_identity()
    profile = tutor_service.get_own_profile(user_id)
    if not profile:
        return error_response(message="Tutor profile not found.", status_code=404)

    return success_response(data=profile, message="Tutor profile retrieved successfully.")


@tutors_bp.route("/profile/me", methods=["PUT"])
@jwt_required()
def update_my_profile():
    """
    Update the authenticated tutor's own profile.
    Prevent users from editing another tutor's profile.
    """
    user_id = get_jwt_identity()
    data = request.get_json() or {}

    profile, err_msg, status_code = tutor_service.update_profile(user_id, data)
    if err_msg:
        return error_response(message=err_msg, status_code=status_code)

    return success_response(data=profile, message="Tutor profile updated successfully.")


@tutors_bp.route("", methods=["GET"])
def get_tutors():
    """
    Public discovery endpoint.
    Supports search by query (name or subject), filter by subject,
    filter by teaching_mode, filter by availability_date, and pagination.
    """
    query = request.args.get("q", "").strip() or request.args.get("query", "").strip()
    subject = request.args.get("subject", "").strip()
    teaching_mode = request.args.get("mode", "").strip() or request.args.get("teaching_mode", "").strip()
    availability_date = request.args.get("date", "").strip() or request.args.get("availability_date", "").strip()

    try:
        page = int(request.args.get("page", 1))
    except ValueError:
        page = 1

    try:
        per_page = int(request.args.get("per_page", 12))
    except ValueError:
        per_page = 12

    tutors, total = tutor_service.search_tutors(
        query=query,
        subject=subject,
        teaching_mode=teaching_mode,
        availability_date=availability_date,
        page=page,
        per_page=per_page,
    )

    total_pages = math.ceil(total / per_page) if per_page > 0 else 1

    return success_response(
        data={
            "tutors": tutors,
            "total": total,
            "page": page,
            "per_page": per_page,
            "total_pages": max(1, total_pages),
        },
        message="Tutors retrieved successfully.",
    )


@tutors_bp.route("/<tutor_id>", methods=["GET"])
def get_tutor(tutor_id: str):
    """
    Public details endpoint for a specific tutor profile.
    """
    tutor = tutor_service.get_tutor_by_id(tutor_id)
    if not tutor:
        return error_response(message="Tutor profile not found.", status_code=404)

    return success_response(data=tutor, message="Tutor details retrieved successfully.")
