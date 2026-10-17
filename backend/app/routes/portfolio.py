"""
Portfolio Routes for PeerConnect Proof-of-Skill.
"""
from flask import Blueprint, request
from flask_jwt_extended import get_jwt_identity, jwt_required

from app.services import portfolio_service
from app.utils.responses import error_response, success_response

portfolio_bp = Blueprint("portfolio", __name__)


@portfolio_bp.route("/me", methods=["GET"])
@jwt_required()
def get_my_portfolio_route():
    """
    Retrieve or initialize the authenticated scholar's portfolio with verified badges.
    """
    user_id = get_jwt_identity()
    portfolio, err_msg, status_code = portfolio_service.get_or_create_portfolio(user_id)
    if err_msg:
        return error_response(message=err_msg, status_code=status_code)

    return success_response(data=portfolio, message="Portfolio retrieved successfully.")


@portfolio_bp.route("/me", methods=["PUT"])
@jwt_required()
def update_my_portfolio_route():
    """
    Update self-reported projects, skills, and portfolio visibility.
    """
    user_id = get_jwt_identity()
    data = request.get_json() or {}

    portfolio, err_msg, status_code = portfolio_service.update_portfolio(user_id, data)
    if err_msg:
        return error_response(message=err_msg, status_code=status_code)

    return success_response(data=portfolio, message="Portfolio updated successfully.")


@portfolio_bp.route("/<user_id>", methods=["GET"])
def get_public_portfolio_route(user_id: str):
    """
    View a user's public portfolio and verified achievements.
    """
    portfolio, err_msg, status_code = portfolio_service.get_public_portfolio(user_id)
    if err_msg:
        return error_response(message=err_msg, status_code=status_code)

    return success_response(data=portfolio, message="Public portfolio retrieved successfully.")
