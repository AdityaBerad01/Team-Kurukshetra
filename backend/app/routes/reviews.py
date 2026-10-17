"""
Review routes for PeerConnect.
Endpoints for submitting reviews and retrieving tutor reviews with real computed ratings.
"""
from flask import Blueprint, request
from flask_jwt_extended import get_jwt_identity, jwt_required

from app.services import review_service
from app.utils.responses import error_response, success_response

reviews_bp = Blueprint("reviews", __name__)


@reviews_bp.route("/reviews", methods=["POST"])
@jwt_required()
def submit_review():
    """
    Submit a review for a completed session request.
    Only authenticated students of the completed session may review.
    """
    user_id = get_jwt_identity()
    data = request.get_json() or {}

    review, err_msg, status_code = review_service.create_review(user_id, data)
    if err_msg:
        return error_response(message=err_msg, status_code=status_code)

    return success_response(data=review, message="Review submitted successfully.", status_code=201)


@reviews_bp.route("/tutors/<tutor_id>/reviews", methods=["GET"])
def get_tutor_reviews(tutor_id: str):
    """
    Publicly retrieve reviews, breakdown, and calculated average rating for a tutor.
    """
    data, err_msg, status_code = review_service.get_tutor_reviews(tutor_id)
    if err_msg:
        return error_response(message=err_msg, status_code=status_code)

    return success_response(data=data, message="Tutor reviews retrieved successfully.")
