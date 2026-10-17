"""
Dashboard service layer for PeerConnect.
Calculates student and tutor dashboard metrics from real authenticated user data,
ensuring strict privacy boundaries between users.
"""
from typing import Any, Dict, Optional, Tuple
from bson import ObjectId

from app.extensions import mongo
from app.services.review_service import calculate_tutor_rating
from app.services.session_request_service import _enrich_requests


def get_student_dashboard(student_id: str) -> Tuple[Optional[Dict[str, Any]], Optional[str], int]:
    """
    Calculate and retrieve dashboard metrics for an authenticated student.
    Strictly queries records belonging to the authenticated student ID.
    """
    try:
        user_oid = ObjectId(student_id)
    except Exception:
        return None, "Invalid student ID.", 400

    user = mongo.db.users.find_one({"_id": user_oid})
    if not user:
        return None, "Student user not found.", 404
    if str(user.get("role", "")).upper() != "STUDENT":
        return None, "Only student accounts can access the student dashboard.", 403

    student_str = str(student_id)

    # Count session requests by status
    total_requests = mongo.db.session_requests.count_documents({"student_id": student_str})
    pending_requests = mongo.db.session_requests.count_documents({"student_id": student_str, "status": "PENDING"})
    upcoming_sessions = mongo.db.session_requests.count_documents({"student_id": student_str, "status": "ACCEPTED"})
    completed_sessions = mongo.db.session_requests.count_documents({"student_id": student_str, "status": "COMPLETED"})

    # Recent session activity (last 5)
    recent_cursor = mongo.db.session_requests.find(
        {"student_id": student_str}
    ).sort("created_at", -1).limit(5)
    recent_requests = _enrich_requests(list(recent_cursor))

    # Eligible completed sessions awaiting review
    completed_cursor = mongo.db.session_requests.find(
        {"student_id": student_str, "status": "COMPLETED"}
    ).sort("completed_at", -1).limit(10)
    completed_enriched = _enrich_requests(list(completed_cursor))
    unreviewed = [s for s in completed_enriched if not s.get("is_reviewed")]

    # Total active tutors on platform
    total_tutors = mongo.db.tutor_profiles.count_documents({})

    # Real credits balance
    credits_balance = int(user.get("credits", 100))

    # Tailored recommendations for student
    from app.services.tutor_service import get_recommendations
    fav_subject = ""
    subjects_to_learn = user.get("subjects_to_learn", [])
    if subjects_to_learn:
        fav_subject = subjects_to_learn[0]
    elif user.get("subjects"):
        fav_subject = user.get("subjects")[0]

    recs = get_recommendations(
        subject=fav_subject,
        language=(user.get("languages", ["English"])[0] if user.get("languages") else ""),
        campus=user.get("campus", ""),
        limit=3,
    )

    # Learning progress summary
    from app.services.assessment_service import get_progress_summary
    progress_summary = get_progress_summary(student_str)

    dashboard_data = {
        "stats": {
            "total_requests": total_requests,
            "pending_requests": pending_requests,
            "upcoming_sessions": upcoming_sessions,
            "completed_sessions": completed_sessions,
            "total_tutors": total_tutors,
            "credits_balance": credits_balance,
            "learning_gain": progress_summary.get("improvement_pct", 0),
        },
        "recommendations": recs,
        "progress": progress_summary,
        "recent_activity": recent_requests,
        "unreviewed_sessions": unreviewed,
    }
    return dashboard_data, None, 200


def get_tutor_dashboard(tutor_id: str) -> Tuple[Optional[Dict[str, Any]], Optional[str], int]:
    """
    Calculate and retrieve dashboard metrics for an authenticated tutor.
    Strictly queries records belonging to the authenticated tutor ID.
    """
    try:
        user_oid = ObjectId(tutor_id)
    except Exception:
        return None, "Invalid tutor ID.", 400

    user = mongo.db.users.find_one({"_id": user_oid})
    if not user:
        return None, "Tutor user not found.", 404
    if str(user.get("role", "")).upper() != "TUTOR":
        return None, "Only tutor accounts can access the tutor dashboard.", 403

    tutor_str = str(tutor_id)

    # 1. Incoming requests
    incoming_requests = mongo.db.session_requests.count_documents({"tutor_id": tutor_str, "status": "PENDING"})

    # 2. Available slots
    available_slots = mongo.db.availability.count_documents({"tutor_id": tutor_str, "status": "AVAILABLE"})

    # 3. Accepted sessions (upcoming)
    accepted_sessions = mongo.db.session_requests.count_documents({"tutor_id": tutor_str, "status": "ACCEPTED"})

    # 4. Completed sessions
    completed_sessions = mongo.db.session_requests.count_documents({"tutor_id": tutor_str, "status": "COMPLETED"})

    # 5. Rating & review calculations directly from reviews collection
    avg_rating, total_reviews = calculate_tutor_rating(tutor_str)

    # 6. Total inquiry count
    total_inquiries = mongo.db.session_requests.count_documents({"tutor_id": tutor_str})

    # 7. Recent activity (last 5)
    recent_cursor = mongo.db.session_requests.find(
        {"tutor_id": tutor_str}
    ).sort("created_at", -1).limit(5)
    recent_requests = _enrich_requests(list(recent_cursor))

    dashboard_data = {
        "stats": {
            "incoming_requests": incoming_requests,
            "available_slots": available_slots,
            "accepted_sessions": accepted_sessions,
            "completed_sessions": completed_sessions,
            "average_rating": avg_rating,
            "total_reviews": total_reviews,
            "total_inquiries": total_inquiries,
            "credits_balance": int(user.get("credits", 100)),
        },
        "recent_activity": recent_requests,
    }
    return dashboard_data, None, 200
