"""
Session Plan & Confidence Tracker Service for PeerConnect.
"""
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional, Tuple
from bson import ObjectId

from app import mongo
from app.models.session_plan import new_session_plan, to_public_session_plan


def _verify_session_participant(user_id: str, request_id: str) -> Tuple[Optional[Dict], Optional[str], int]:
    """
    Ensure the user is either the student or tutor of the specified session request.
    """
    try:
        req_oid = ObjectId(request_id)
    except Exception:
        return None, "Invalid request ID format.", 400

    req = mongo.db.session_requests.find_one({"_id": req_oid})
    if not req:
        return None, "Session request not found.", 404

    u_str = str(user_id)
    if str(req.get("student_id", "")) != u_str and str(req.get("tutor_id", "")) != u_str:
        return None, "You are not authorized to access this session plan.", 403

    return req, None, 200


def get_or_create_plan(user_id: str, request_id: str) -> Tuple[Optional[Dict], Optional[str], int]:
    """
    Retrieve or initialize the structured session plan for a booking.
    """
    session_req, err, code = _verify_session_participant(user_id, request_id)
    if err:
        return None, err, code

    plan = mongo.db.session_plans.find_one({"request_id": str(request_id)})
    if not plan:
        plan = new_session_plan(str(request_id))
        res = mongo.db.session_plans.insert_one(plan)
        plan["_id"] = res.inserted_id

    return to_public_session_plan(plan), None, 200


def update_plan(user_id: str, request_id: str, data: Dict[str, Any]) -> Tuple[Optional[Dict], Optional[str], int]:
    """
    Update session objectives, difficult concepts, agenda items, and follow-up tasks.
    """
    session_req, err, code = _verify_session_participant(user_id, request_id)
    if err:
        return None, err, code

    update_fields: Dict[str, Any] = {"updated_at": datetime.now(timezone.utc)}

    if "objectives" in data:
        update_fields["objectives"] = str(data["objectives"]).strip()
    if "difficult_concepts" in data:
        update_fields["difficult_concepts"] = str(data["difficult_concepts"]).strip()
    if "agenda_items" in data and isinstance(data["agenda_items"], list):
        update_fields["agenda_items"] = data["agenda_items"]
    if "follow_up_tasks" in data and isinstance(data["follow_up_tasks"], list):
        update_fields["follow_up_tasks"] = data["follow_up_tasks"]

    mongo.db.session_plans.update_one(
        {"request_id": str(request_id)},
        {"$set": update_fields},
        upsert=True,
    )

    updated = mongo.db.session_plans.find_one({"request_id": str(request_id)})
    return to_public_session_plan(updated), None, 200


def record_confidence(user_id: str, request_id: str, data: Dict[str, Any]) -> Tuple[Optional[Dict], Optional[str], int]:
    """
    Student rates their confidence (1 to 5) before or after a tutoring session.
    """
    session_req, err, code = _verify_session_participant(user_id, request_id)
    if err:
        return None, err, code

    # Only student may self-report confidence
    if str(session_req.get("student_id", "")) != str(user_id):
        return None, "Only the student may record topic confidence ratings.", 403

    update_fields: Dict[str, Any] = {"updated_at": datetime.now(timezone.utc)}

    if "pre_confidence" in data:
        try:
            val = int(data["pre_confidence"])
            if 1 <= val <= 5:
                update_fields["pre_confidence"] = val
        except (ValueError, TypeError):
            pass

    if "post_confidence" in data:
        try:
            val = int(data["post_confidence"])
            if 1 <= val <= 5:
                update_fields["post_confidence"] = val
        except (ValueError, TypeError):
            pass

    if "confidence_notes" in data:
        update_fields["confidence_notes"] = str(data["confidence_notes"]).strip()

    mongo.db.session_plans.update_one(
        {"request_id": str(request_id)},
        {"$set": update_fields},
        upsert=True,
    )

    updated = mongo.db.session_plans.find_one({"request_id": str(request_id)})
    return to_public_session_plan(updated), None, 200


def get_student_confidence_trends(user_id: str) -> List[Dict[str, Any]]:
    """
    Aggregate student's confidence ratings over time across completed sessions.
    """
    u_str = str(user_id)
    # Find all session requests for this student
    requests = list(mongo.db.session_requests.find({"student_id": u_str}).sort("created_at", -1))
    req_ids = [str(r["_id"]) for r in requests]

    if not req_ids:
        return []

    plans = list(mongo.db.session_plans.find({"request_id": {"$in": req_ids}}))
    plans_map = {p["request_id"]: p for p in plans}

    trends = []
    for r in requests:
        r_id = str(r["_id"])
        plan = plans_map.get(r_id)
        if plan and (plan.get("pre_confidence") is not None or plan.get("post_confidence") is not None):
            pre_val = plan.get("pre_confidence")
            post_val = plan.get("post_confidence")
            delta = (post_val - pre_val) if (pre_val is not None and post_val is not None) else None
            created_at = r.get("created_at")
            c_str = created_at.strftime("%b %d") if isinstance(created_at, datetime) else "Recent"
            trends.append({
                "session_id": r_id,
                "subject": r.get("subject", "General"),
                "date": c_str,
                "pre_confidence": pre_val,
                "post_confidence": post_val,
                "delta": delta,
                "notes": plan.get("confidence_notes", ""),
            })

    return trends
