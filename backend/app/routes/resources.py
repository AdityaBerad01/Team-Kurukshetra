"""
Community Resources and Notes Exchange Routes for PeerConnect.
"""
from flask import Blueprint, request
from flask_jwt_extended import get_jwt_identity, jwt_required

from app.services import resource_service
from app.utils.responses import error_response, success_response

resources_bp = Blueprint("resources", __name__)


@resources_bp.route("", methods=["POST"])
@jwt_required()
def create_resource_route():
    """
    Publish a new community study resource or note link.
    """
    user_id = get_jwt_identity()
    data = request.get_json() or {}

    resource, err_msg, status_code = resource_service.create_resource(user_id, data)
    if err_msg:
        return error_response(message=err_msg, status_code=status_code)

    return success_response(data=resource, message="Resource published successfully.", status_code=201)


@resources_bp.route("", methods=["GET"])
def get_resources_route():
    """
    Publicly search and retrieve study resources with subject, language, and popularity sorting.
    """
    query = request.args.get("q", "").strip() or request.args.get("query", "").strip()
    subject = request.args.get("subject", "").strip()
    language = request.args.get("language", "").strip()
    resource_type = request.args.get("resource_type", "").strip()
    sort_by = request.args.get("sort_by", "popular").strip()

    try:
        page = int(request.args.get("page", 1))
    except ValueError:
        page = 1

    try:
        per_page = int(request.args.get("per_page", 12))
    except ValueError:
        per_page = 12

    # Optional user context if token provided
    current_user_id = None
    from flask_jwt_extended import verify_jwt_in_request
    try:
        verify_jwt_in_request(optional=True)
        current_user_id = get_jwt_identity()
    except Exception:
        pass

    results = resource_service.get_resources(
        query=query,
        subject=subject,
        language=language,
        resource_type=resource_type,
        sort_by=sort_by,
        page=page,
        per_page=per_page,
        current_user_id=current_user_id,
    )

    return success_response(data=results, message="Resources retrieved successfully.")


@resources_bp.route("/<resource_id>/upvote", methods=["POST"])
@jwt_required()
def upvote_resource_route(resource_id: str):
    """
    Toggle helpful upvote on a resource.
    """
    user_id = get_jwt_identity()
    updated, err_msg, status_code = resource_service.toggle_upvote(user_id, resource_id)
    if err_msg:
        return error_response(message=err_msg, status_code=status_code)

    return success_response(data=updated, message="Upvote updated.")


@resources_bp.route("/<resource_id>", methods=["DELETE"])
@jwt_required()
def delete_resource_route(resource_id: str):
    """
    Delete a study resource owned by the authenticated author.
    """
    user_id = get_jwt_identity()
    success, err_msg, status_code = resource_service.delete_resource(user_id, resource_id)
    if err_msg:
        return error_response(message=err_msg, status_code=status_code)

    return success_response(message="Resource deleted successfully.")
