"""
Focus Rooms and Study Sprints Routes for PeerConnect.
"""
from flask import Blueprint, request
from flask_jwt_extended import get_jwt_identity, jwt_required

from app.services import focus_service
from app.utils.responses import error_response, success_response

focus_bp = Blueprint("focus", __name__)


@focus_bp.route("/rooms", methods=["POST"])
@jwt_required()
def create_room_route():
    """
    Host creates a new collaborative study sprint room.
    """
    user_id = get_jwt_identity()
    data = request.get_json() or {}

    room, err_msg, status_code = focus_service.create_room(user_id, data)
    if err_msg:
        return error_response(message=err_msg, status_code=status_code)

    return success_response(data=room, message="Focus room created successfully.", status_code=201)


@focus_bp.route("/rooms", methods=["GET"])
def get_rooms_route():
    """
    List currently active focus rooms.
    """
    current_user_id = None
    from flask_jwt_extended import verify_jwt_in_request
    try:
        verify_jwt_in_request(optional=True)
        current_user_id = get_jwt_identity()
    except Exception:
        pass

    rooms = focus_service.get_active_rooms(current_user_id=current_user_id)
    return success_response(data=rooms, message="Active focus rooms retrieved.")


@focus_bp.route("/rooms/<room_id>/join", methods=["POST"])
@jwt_required()
def join_room_route(room_id: str):
    """
    Join an active focus study room.
    """
    user_id = get_jwt_identity()
    room, err_msg, status_code = focus_service.join_room(user_id, room_id)
    if err_msg:
        return error_response(message=err_msg, status_code=status_code)

    return success_response(data=room, message="Joined focus room.")


@focus_bp.route("/rooms/<room_id>/leave", methods=["POST"])
@jwt_required()
def leave_room_route(room_id: str):
    """
    Leave an active focus study room.
    """
    user_id = get_jwt_identity()
    room, err_msg, status_code = focus_service.leave_room(user_id, room_id)
    if err_msg:
        return error_response(message=err_msg, status_code=status_code)

    return success_response(data=room, message="Left focus room.")


@focus_bp.route("/complete-sprint", methods=["POST"])
@jwt_required()
def complete_sprint_route():
    """
    Log an accomplished Pomodoro sprint session in the student's study log.
    """
    user_id = get_jwt_identity()
    data = request.get_json() or {}

    room_id = data.get("room_id")
    subject = data.get("subject", "General Study")
    goal = data.get("goal", "")
    duration = data.get("duration_minutes", 25)

    result, err_msg, status_code = focus_service.complete_sprint(
        user_id=user_id,
        room_id=room_id,
        subject=subject,
        goal=goal,
        duration_minutes=duration,
    )
    if err_msg:
        return error_response(message=err_msg, status_code=status_code)

    return success_response(data=result, message="Focus sprint logged successfully.", status_code=201)


@focus_bp.route("/my-stats", methods=["GET"])
@jwt_required()
def get_my_stats_route():
    """
    Retrieve user's cumulative focus study sprint statistics.
    """
    user_id = get_jwt_identity()
    stats = focus_service.get_my_focus_stats(user_id)
    return success_response(data=stats, message="Focus stats retrieved.")
