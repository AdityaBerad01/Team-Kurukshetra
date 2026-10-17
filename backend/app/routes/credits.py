"""
Credit and Wallet routes for PeerConnect.
Provides wallet balance, transaction ledger history, and honorarium status.
"""
from flask import Blueprint
from flask_jwt_extended import get_jwt_identity, jwt_required

from app.services import credit_service
from app.utils.responses import success_response, error_response

credits_bp = Blueprint("credits", __name__)


@credits_bp.route("/wallet", methods=["GET"])
@jwt_required()
def get_user_wallet():
    """
    Retrieve current authenticated user's wallet metrics and ledger transactions.
    """
    user_id = get_jwt_identity()
    wallet_data = credit_service.get_wallet(user_id)
    return success_response(data=wallet_data, message="Wallet details retrieved successfully.")


@credits_bp.route("/transactions", methods=["GET"])
@jwt_required()
def get_user_transactions():
    """
    Retrieve the transaction ledger history for the authenticated user.
    """
    user_id = get_jwt_identity()
    wallet_data = credit_service.get_wallet(user_id)
    return success_response(data=wallet_data.get("transactions", []), message="Transactions retrieved.")
