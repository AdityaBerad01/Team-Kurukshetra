"""
Review model schema and serialization helpers for PeerConnect.
"""
from datetime import datetime, timezone
from typing import Any, Dict, Optional


def new_review(
    student_id: str,
    tutor_id: str,
    request_id: str,
    rating: int,
    comment: str,
) -> Dict[str, Any]:
    """
    Build a new review document for MongoDB insertion.
    """
    now = datetime.now(timezone.utc)
    return {
        "student_id": str(student_id),
        "tutor_id": str(tutor_id),
        "request_id": str(request_id),
        "rating": int(rating),
        "comment": comment.strip(),
        "created_at": now,
        "updated_at": now,
    }


def to_safe_review(
    review_doc: Optional[Dict[str, Any]],
    student_name: str = "",
) -> Optional[Dict[str, Any]]:
    """
    Serialize a review document for safe public API exposure.
    Never exposes passwords, emails, or private account data.
    """
    if not review_doc:
        return None

    from app.models.user import generate_initials

    created_at = review_doc.get("created_at")
    created_str = created_at.isoformat() if isinstance(created_at, datetime) else str(created_at or "")

    return {
        "id": str(review_doc.get("_id", "")),
        "student_id": str(review_doc.get("student_id", "")),
        "student_name": student_name or "Peer Student",
        "student_initials": generate_initials(student_name) if student_name else "PS",
        "tutor_id": str(review_doc.get("tutor_id", "")),
        "request_id": str(review_doc.get("request_id", "")),
        "rating": int(review_doc.get("rating", 5)),
        "comment": str(review_doc.get("comment", "")),
        "created_at": created_str,
    }
