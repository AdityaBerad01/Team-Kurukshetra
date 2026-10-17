"""
Availability slot routes for PeerConnect.
Handles slot creation, retrieval, updates, and deletion.
"""
from flask import Blueprint, request
from flask_jwt_extended import get_jwt_identity, jwt_required

from app.services import availability_service
from app.utils.responses import error_response, success_response

slots_bp = Blueprint("slots", __name__)


@slots_bp.route("", methods=["POST"])
@jwt_required()
def create_slot():
    """
    Create a new availability slot for the authenticated tutor.
    """
    user_id = get_jwt_identity()
    data = request.get_json() or {}

    slot, err_msg, status_code = availability_service.create_slot(user_id, data)
    if err_msg:
        return error_response(message=err_msg, status_code=status_code)

    return success_response(data=slot, message="Availability slot created successfully.", status_code=201)


@slots_bp.route("/tutor/<tutor_id>", methods=["GET"])
def get_tutor_slots(tutor_id: str):
    """
    Retrieve all slots for a specific tutor with optional status and date filters.
    """
    status = request.args.get("status")
    date = request.args.get("date")

    slots = availability_service.get_tutor_slots(tutor_id, status=status, date=date)
    return success_response(data=slots, message="Tutor availability slots retrieved.")


@slots_bp.route("/available", methods=["GET"])
def get_available_slots():
    """
    Retrieve available slots across all tutors with optional filters.
    """
    tutor_id = request.args.get("tutor_id")
    date = request.args.get("date")
    teaching_mode = request.args.get("teaching_mode") or request.args.get("mode")

    slots = availability_service.get_available_slots(
        tutor_id=tutor_id,
        date=date,
        teaching_mode=teaching_mode,
    )
    return success_response(data=slots, message="Available slots retrieved.")


@slots_bp.route("/<slot_id>", methods=["PUT"])
@jwt_required()
def update_slot(slot_id: str):
    """
    Update an existing availability slot owned by the authenticated tutor.
    """
    user_id = get_jwt_identity()
    data = request.get_json() or {}

    slot, err_msg, status_code = availability_service.update_slot(user_id, slot_id, data)
    if err_msg:
        return error_response(message=err_msg, status_code=status_code)

    return success_response(data=slot, message="Availability slot updated successfully.")


@slots_bp.route("/<slot_id>", methods=["DELETE"])
@jwt_required()
def delete_slot(slot_id: str):
    """
    Delete an availability slot owned by the authenticated tutor.
    """
    user_id = get_jwt_identity()

    success, err_msg, status_code = availability_service.delete_slot(user_id, slot_id)
    if err_msg:
        return error_response(message=err_msg, status_code=status_code)

    return success_response(message="Availability slot deleted successfully.")
