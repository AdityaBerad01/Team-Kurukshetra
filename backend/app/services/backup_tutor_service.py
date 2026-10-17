"""
Backup Tutor Service for PeerConnect.
Finds alternative, compatible tutors and open slots when a tutoring session is declined or cancelled.
Preserves original subject, learning goals, mode, and languages.
"""
from datetime import datetime, timezone
from typing import Dict, List, Optional, Tuple
from bson import ObjectId

from app import mongo
from app.services.tutor_service import get_recommendations
from app.services.availability_service import get_tutor_slots


def get_backup_tutors_for_request(
    user_id: str,
    request_id: str,
    limit: int = 5,
) -> Tuple[Optional[Dict], Optional[str], int]:
    """
    Given a declined or cancelled session request owned by the authenticated student,
    retrieve alternative backup tutors matching the original request details.
    """
    try:
        req_oid = ObjectId(request_id)
    except Exception:
        return None, "Invalid session request ID format.", 400

    req = mongo.db.session_requests.find_one({"_id": req_oid})
    if not req:
        return None, "Session request not found.", 404

    # Enforce authorization: must be the student of the request
    if str(req.get("student_id", "")) != str(user_id):
        return None, "You are not authorized to view backup tutors for this request.", 403

    original_tutor_id = str(req.get("tutor_id", ""))
    subject = req.get("subject", "")
    topic = req.get("topic", "")
    original_status = req.get("status", "")

    # Retrieve original slot if available to inspect mode and date
    teaching_mode = ""
    target_date = ""
    slot_id_str = str(req.get("slot_id", ""))
    if slot_id_str:
        try:
            orig_slot = mongo.db.availability.find_one({"_id": ObjectId(slot_id_str)})
            if orig_slot:
                teaching_mode = orig_slot.get("teaching_mode", "")
                target_date = orig_slot.get("date", "")
        except Exception:
            pass

    # Retrieve student's preferred languages and campus from user doc
    student_doc = mongo.db.users.find_one({"_id": ObjectId(user_id)}) or {}
    languages = student_doc.get("languages", ["English"])
    campus = student_doc.get("campus", "")
    primary_language = languages[0] if languages else "English"

    # Fetch ranked candidate tutors using the explainable matching algorithm
    candidates = get_recommendations(
        subject=subject,
        teaching_mode=teaching_mode,
        language=primary_language,
        campus=campus,
        limit=limit + 3,
    )

    # Exclude the original tutor who declined or cancelled
    filtered_candidates = [
        c for c in candidates
        if str(c.get("user_id", "")) != original_tutor_id and str(c.get("id", "")) != original_tutor_id
    ][:limit]

    # For each candidate tutor, attach their available upcoming slots
    now_str = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    backup_tutors_with_slots = []
    for candidate in filtered_candidates:
        candidate_uid = candidate.get("user_id") or candidate.get("id")
        open_slots = get_tutor_slots(candidate_uid, status="AVAILABLE")
        # Filter for slots today or in the future
        future_slots = [s for s in open_slots if s.get("date", "") >= now_str]
        
        reasons = list(candidate.get("reasons", []))
        if future_slots:
            reasons.append(f"{len(future_slots)} open time slots available")

        backup_tutors_with_slots.append({
            **candidate,
            "reasons": reasons,
            "available_slots": future_slots[:4],
        })

    return {
        "original_request_id": request_id,
        "original_status": original_status,
        "subject": subject,
        "topic": topic,
        "preferred_mode": teaching_mode,
        "backup_tutors": backup_tutors_with_slots,
    }, None, 200
