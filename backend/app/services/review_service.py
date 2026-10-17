"""
Review service layer for PeerConnect.
Handles review submission, session eligibility validation, unique review enforcement,
and real-time rating calculation from stored reviews.
"""
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional, Tuple

from bson import ObjectId

from app.extensions import mongo
from app.models.review import new_review, to_safe_review


def create_review(student_id: str, data: Dict[str, Any]) -> Tuple[Optional[Dict], Optional[str], int]:
    """
    Submit a review for a completed session request.
    Only the student participant of the completed session may review.
    Enforces at most one review per session request.
    """
    request_id_raw = str(data.get("request_id", "")).strip()
    rating_raw = data.get("rating")
    comment_raw = str(data.get("comment", "")).strip()

    # 1. Validate request_id
    if not request_id_raw:
        return None, "Request ID is required.", 400

    try:
        req_oid = ObjectId(request_id_raw)
    except Exception:
        return None, "Invalid request ID format.", 400

    # 2. Validate rating
    if rating_raw is None:
        return None, "Rating is required.", 400

    try:
        rating = int(rating_raw)
    except (ValueError, TypeError):
        return None, "Rating must be an integer between 1 and 5.", 400

    if rating < 1 or rating > 5:
        return None, "Rating must be between 1 and 5.", 400

    # 3. Validate comment
    if not comment_raw:
        return None, "Review comment is required.", 400
    if len(comment_raw) < 3:
        return None, "Comment must be at least 3 characters long.", 400
    if len(comment_raw) > 1000:
        return None, "Comment cannot exceed 1000 characters.", 400

    # 4. Fetch and verify the session request
    session_req = mongo.db.session_requests.find_one({"_id": req_oid})
    if not session_req:
        return None, "Tutoring session request not found.", 404

    # Authorization rule: only the student associated with the session can review
    if str(session_req.get("student_id", "")) != str(student_id):
        return None, "You are not authorized to review this session.", 403

    # Status rule: session must be COMPLETED
    session_status = str(session_req.get("status", "")).upper()
    if session_status != "COMPLETED":
        return None, f"Only completed sessions can be reviewed (current status: '{session_status}').", 400

    # Uniqueness rule: at most one review per session request
    existing_review = mongo.db.reviews.find_one({"request_id": str(req_oid)})
    if existing_review:
        return None, "A review has already been submitted for this tutoring session.", 409

    tutor_id_str = str(session_req.get("tutor_id", ""))
    if not tutor_id_str:
        return None, "Session request lacks a valid tutor reference.", 400

    # 5. Build and insert review document
    review_doc = new_review(
        student_id=str(student_id),
        tutor_id=tutor_id_str,
        request_id=str(req_oid),
        rating=rating,
        comment=comment_raw,
    )

    try:
        result = mongo.db.reviews.insert_one(review_doc)
        review_doc["_id"] = result.inserted_id
    except Exception as e:
        # Catch duplicate key error if concurrent insert happened
        if "duplicate key" in str(e).lower() or "e11000" in str(e).lower():
            return None, "A review has already been submitted for this tutoring session.", 409
        return None, "Failed to record review.", 500

    # 6. Recalculate tutor's average rating and total reviews from database
    avg_rating, total_reviews = calculate_tutor_rating(tutor_id_str)

    # Persist the recalculated rating on tutor profile for fast discovery filtering
    try:
        mongo.db.tutor_profiles.update_one(
            {"user_id": tutor_id_str},
            {"$set": {"rating": avg_rating, "review_count": total_reviews, "updated_at": datetime.now(timezone.utc)}},
        )
    except Exception:
        pass

    # 7. Enrich and return safe review
    student_user = mongo.db.users.find_one({"_id": ObjectId(student_id)})
    student_name = student_user.get("name", "") if student_user else ""

    return to_safe_review(review_doc, student_name), None, 201


def get_tutor_reviews(tutor_id: str) -> Tuple[Optional[Dict], Optional[str], int]:
    """
    Retrieve all reviews and aggregate rating statistics for a tutor.
    """
    if not tutor_id:
        return None, "Tutor ID is required.", 400

    tutor_str = str(tutor_id).strip()
    tutor_ids = [tutor_str]
    try:
        prof = mongo.db.tutor_profiles.find_one({"_id": ObjectId(tutor_str)})
        if prof and prof.get("user_id"):
            tutor_ids.append(str(prof["user_id"]))
    except Exception:
        pass

    # Find all reviews for tutor
    reviews_cursor = mongo.db.reviews.find({"tutor_id": {"$in": tutor_ids}}).sort("created_at", -1)
    raw_reviews = list(reviews_cursor)

    total_reviews = len(raw_reviews)
    if total_reviews > 0:
        ratings_sum = sum(int(r.get("rating", 0)) for r in raw_reviews)
        avg_rating = round(ratings_sum / total_reviews, 1)
    else:
        avg_rating = 0.0

    # Calculate rating breakdown
    breakdown = {1: 0, 2: 0, 3: 0, 4: 0, 5: 0}
    for r in raw_reviews:
        val = int(r.get("rating", 5))
        if val in breakdown:
            breakdown[val] += 1

    # Batch load student names
    student_ids = list({r.get("student_id") for r in raw_reviews if r.get("student_id")})
    student_oids = []
    for sid in student_ids:
        try:
            student_oids.append(ObjectId(sid))
        except Exception:
            pass

    students_map = {}
    if student_oids:
        users = mongo.db.users.find({"_id": {"$in": student_oids}}, {"name": 1})
        students_map = {str(u["_id"]): u.get("name", "") for u in users}

    safe_reviews = []
    for r in raw_reviews:
        st_name = students_map.get(str(r.get("student_id", "")), "")
        safe_reviews.append(to_safe_review(r, st_name))

    data = {
        "tutor_id": tutor_str,
        "average_rating": avg_rating,
        "total_reviews": total_reviews,
        "breakdown": breakdown,
        "reviews": safe_reviews,
    }
    return data, None, 200


def calculate_tutor_rating(tutor_id: str) -> Tuple[float, int]:
    """
    Calculate average rating and review count directly from stored reviews.
    """
    tutor_str = str(tutor_id).strip()
    tutor_ids = [tutor_str]
    try:
        prof = mongo.db.tutor_profiles.find_one({"_id": ObjectId(tutor_str)})
        if prof and prof.get("user_id"):
            tutor_ids.append(str(prof["user_id"]))
    except Exception:
        pass

    reviews = list(mongo.db.reviews.find({"tutor_id": {"$in": tutor_ids}}, {"rating": 1}))
    total_reviews = len(reviews)
    if total_reviews == 0:
        return 0.0, 0

    total_stars = sum(int(r.get("rating", 0)) for r in reviews)
    avg = round(total_stars / total_reviews, 1)
    return avg, total_reviews


def ensure_review_indexes():
    """Create MongoDB indexes for reviews collection."""
    try:
        mongo.db.reviews.create_index([("request_id", 1)], unique=True)
        mongo.db.reviews.create_index([("tutor_id", 1), ("created_at", -1)])
        mongo.db.reviews.create_index([("student_id", 1), ("created_at", -1)])
    except Exception as e:
        print(f"Warning: Failed to create review indexes: {e}")
