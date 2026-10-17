"""
Session request service layer for PeerConnect.
Handles tutoring requests, subject validation, atomic conditional slot reservation,
concurrency control, and status transitions.
"""
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional, Tuple

from bson import ObjectId

from app.extensions import mongo
from app.models.session_request import (
    new_session_request,
    to_safe_request,
)


def create_request(student_id: str, data: Dict[str, Any]) -> Tuple[Optional[Dict], Optional[str], int]:
    """
    Create a new tutoring session request from an authenticated student.
    Validates slot availability, subject matching, and prevents self-booking.
    """
    # 1. Verify student role
    try:
        student_oid = ObjectId(student_id)
    except Exception:
        return None, "Invalid student ID.", 400

    student = mongo.db.users.find_one({"_id": student_oid})
    if not student:
        return None, "Student user not found.", 404
    if str(student.get("role", "")).upper() != "STUDENT":
        return None, "Only authenticated students can request tutoring sessions.", 403

    slot_id_str = str(data.get("slot_id", "")).strip()
    subject_str = str(data.get("subject", "")).strip()
    message_str = str(data.get("message", "")).strip()

    if not slot_id_str:
        return None, "Slot ID is required.", 400
    if not subject_str:
        return None, "Subject is required.", 400

    # 2. Look up the availability slot
    try:
        slot_oid = ObjectId(slot_id_str)
    except Exception:
        return None, "Invalid slot ID format.", 400

    slot = mongo.db.availability.find_one({"_id": slot_oid})
    if not slot:
        return None, "Availability slot not found.", 404

    # Slot must be AVAILABLE
    if slot.get("status") != "AVAILABLE":
        return None, "This slot is no longer available for booking.", 400

    # Past date check
    today_utc_str = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    if slot.get("date", "") < today_utc_str:
        return None, "Cannot book a slot on a past date.", 400

    tutor_id_str = str(slot.get("tutor_id", ""))

    # 3. Prevent self-booking (student cannot book own slot)
    if student_id == tutor_id_str:
        return None, "You cannot book your own tutoring slot.", 400

    # 4. Validate subject against tutor's subjects
    tutor_profile = mongo.db.tutor_profiles.find_one({"user_id": tutor_id_str})
    tutor_user = mongo.db.users.find_one({"_id": ObjectId(tutor_id_str)})
    if not tutor_user:
        return None, "Tutor account not found.", 404

    allowed_subjects = []
    if tutor_profile and "subjects" in tutor_profile:
        allowed_subjects = [s.strip().lower() for s in tutor_profile["subjects"]]
    elif tutor_user and "subjects" in tutor_user:
        allowed_subjects = [s.strip().lower() for s in tutor_user["subjects"]]

    if allowed_subjects and subject_str.lower() not in allowed_subjects:
        return None, f"Tutor does not offer '{subject_str}'. Available subjects: {', '.join(allowed_subjects)}.", 400

    # 5. Prevent duplicate pending requests from same student for same slot
    duplicate = mongo.db.session_requests.find_one(
        {"student_id": str(student_id), "slot_id": str(slot_id_str), "status": "PENDING"}
    )
    if duplicate:
        return None, "You already have a pending request for this slot.", 409

    # 6. Insert new request
    req_doc = new_session_request(
        student_id=student_id,
        tutor_id=tutor_id_str,
        slot_id=slot_id_str,
        subject=subject_str,
        message=message_str,
        status="PENDING",
    )
    result = mongo.db.session_requests.insert_one(req_doc)
    created = mongo.db.session_requests.find_one({"_id": result.inserted_id})

    return (
        to_safe_request(
            created,
            student_name=student.get("name", ""),
            tutor_name=tutor_user.get("name", ""),
            slot_info=slot,
        ),
        None,
        201,
    )


def get_student_requests(student_id: str) -> List[Dict]:
    """Retrieve all requests made by the authenticated student."""
    requests = list(
        mongo.db.session_requests.find({"student_id": str(student_id)}).sort("created_at", -1)
    )
    return _enrich_requests(requests)


def get_tutor_incoming_requests(tutor_id: str) -> List[Dict]:
    """Retrieve all incoming requests for the authenticated tutor."""
    requests = list(
        mongo.db.session_requests.find({"tutor_id": str(tutor_id)}).sort("created_at", -1)
    )
    return _enrich_requests(requests)


def accept_request(user_id: str, request_id: str) -> Tuple[Optional[Dict], Optional[str], int]:
    """
    Tutor accepts an incoming request.
    Concurrency Control:
    Uses atomic conditional find_one_and_update to guarantee only one request
    can EVER claim an available slot. Automatically declines competing pending requests.
    """
    try:
        req_oid = ObjectId(request_id)
    except Exception:
        return None, "Invalid request ID.", 400

    req = mongo.db.session_requests.find_one({"_id": req_oid})
    if not req:
        return None, "Session request not found.", 404

    # Ownership check: only assigned tutor can accept
    if str(req.get("tutor_id", "")) != str(user_id):
        return None, "You are not authorized to accept this request.", 403

    # Status check
    if req.get("status") != "PENDING":
        return None, f"Cannot accept a request with status '{req.get('status')}'.", 400

    slot_id_str = str(req.get("slot_id", ""))
    try:
        slot_oid = ObjectId(slot_id_str)
    except Exception:
        return None, "Invalid associated slot ID.", 400

    now = datetime.now(timezone.utc)

    # ── ATOMIC CAS: Conditional Slot Reservation ──────────────────────────────
    # Atomically transitions status AVAILABLE -> BOOKED.
    # If another concurrent request was already accepted, this returns None!
    reserved_slot = mongo.db.availability.find_one_and_update(
        {"_id": slot_oid, "status": "AVAILABLE"},
        {"$set": {"status": "BOOKED", "updated_at": now}},
    )
    if not reserved_slot:
        return None, "Slot is no longer available or was already booked.", 409

    # Update request to ACCEPTED
    mongo.db.session_requests.update_one(
        {"_id": req_oid},
        {"$set": {"status": "ACCEPTED", "updated_at": now}},
    )

    # Automatically decline all other competing PENDING requests for this slot
    mongo.db.session_requests.update_many(
        {"slot_id": slot_id_str, "_id": {"$ne": req_oid}, "status": "PENDING"},
        {
            "$set": {
                "status": "DECLINED",
                "message": "Slot was booked by another student.",
                "updated_at": now,
            }
        },
    )

    updated_req = mongo.db.session_requests.find_one({"_id": req_oid})
    enriched = _enrich_requests([updated_req])
    return enriched[0] if enriched else None, None, 200


def decline_request(user_id: str, request_id: str) -> Tuple[Optional[Dict], Optional[str], int]:
    """Tutor declines an incoming request."""
    try:
        req_oid = ObjectId(request_id)
    except Exception:
        return None, "Invalid request ID.", 400

    req = mongo.db.session_requests.find_one({"_id": req_oid})
    if not req:
        return None, "Session request not found.", 404

    if str(req.get("tutor_id", "")) != str(user_id):
        return None, "You are not authorized to decline this request.", 403

    if req.get("status") != "PENDING":
        return None, f"Cannot decline a request with status '{req.get('status')}'.", 400

    now = datetime.now(timezone.utc)
    mongo.db.session_requests.update_one(
        {"_id": req_oid},
        {"$set": {"status": "DECLINED", "updated_at": now}},
    )

    updated_req = mongo.db.session_requests.find_one({"_id": req_oid})
    enriched = _enrich_requests([updated_req])
    return enriched[0] if enriched else None, None, 200


def cancel_request(user_id: str, request_id: str) -> Tuple[Optional[Dict], Optional[str], int]:
    """
    Student cancels their own request.
    If the request was already ACCEPTED, the booked slot is atomically released
    back to AVAILABLE.
    """
    try:
        req_oid = ObjectId(request_id)
    except Exception:
        return None, "Invalid request ID.", 400

    req = mongo.db.session_requests.find_one({"_id": req_oid})
    if not req:
        return None, "Session request not found.", 404

    if str(req.get("student_id", "")) != str(user_id):
        return None, "You are not authorized to cancel this request.", 403

    current_status = req.get("status")
    if current_status not in ("PENDING", "ACCEPTED"):
        return None, f"Cannot cancel a request that is already '{current_status}'.", 400

    now = datetime.now(timezone.utc)
    slot_id_str = str(req.get("slot_id", ""))

    # If was ACCEPTED, release slot back to AVAILABLE
    if current_status == "ACCEPTED" and slot_id_str:
        try:
            mongo.db.availability.update_one(
                {"_id": ObjectId(slot_id_str)},
                {"$set": {"status": "AVAILABLE", "updated_at": now}},
            )
        except Exception:
            pass

    mongo.db.session_requests.update_one(
        {"_id": req_oid},
        {"$set": {"status": "CANCELLED", "updated_at": now}},
    )

    updated_req = mongo.db.session_requests.find_one({"_id": req_oid})
    enriched = _enrich_requests([updated_req])
    return enriched[0] if enriched else None, None, 200


def _enrich_requests(requests: List[Dict]) -> List[Dict]:
    """Helper to batch-load slot, tutor, and student details for requests."""
    if not requests:
        return []

    # Batch IDs
    slot_ids = list({r.get("slot_id") for r in requests if r.get("slot_id")})
    user_ids = list(
        {r.get("student_id") for r in requests if r.get("student_id")}
        | {r.get("tutor_id") for r in requests if r.get("tutor_id")}
    )

    slot_oids = []
    for sid in slot_ids:
        try:
            slot_oids.append(ObjectId(sid))
        except Exception:
            pass

    user_oids = []
    for uid in user_ids:
        try:
            user_oids.append(ObjectId(uid))
        except Exception:
            pass

    slots_map = {}
    if slot_oids:
        slots = mongo.db.availability.find({"_id": {"$in": slot_oids}})
        slots_map = {str(s["_id"]): s for s in slots}

    users_map = {}
    if user_oids:
        users = mongo.db.users.find({"_id": {"$in": user_oids}}, {"name": 1})
        users_map = {str(u["_id"]): u.get("name", "") for u in users}

    results = []
    for r in requests:
        slot = slots_map.get(str(r.get("slot_id", "")))
        student_name = users_map.get(str(r.get("student_id", "")), "")
        tutor_name = users_map.get(str(r.get("tutor_id", "")), "")
        results.append(to_safe_request(r, student_name, tutor_name, slot))

    return results


def ensure_request_indexes():
    """Create MongoDB indexes for session_requests collection."""
    try:
        mongo.db.session_requests.create_index([("student_id", 1), ("created_at", -1)])
        mongo.db.session_requests.create_index([("tutor_id", 1), ("status", 1), ("created_at", -1)])
        mongo.db.session_requests.create_index([("slot_id", 1), ("status", 1)])
        mongo.db.session_requests.create_index("created_at")
    except Exception as e:
        print(f"Warning: Failed to create session_requests indexes: {e}")
