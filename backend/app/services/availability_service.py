"""
Availability service layer for PeerConnect.
Handles slot validation, overlap detection, timezone handling, and CRUD operations.
"""
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional, Tuple

from bson import ObjectId

from app.extensions import mongo
from app.models.availability import (
    VALID_SLOT_STATUSES,
    VALID_TEACHING_MODES,
    new_slot,
    to_safe_slot,
)


def parse_time_to_minutes(time_str: str) -> Optional[int]:
    """Parse 'HH:MM' string to total minutes since midnight."""
    try:
        parts = time_str.strip().split(":")
        if len(parts) != 2:
            return None
        h, m = int(parts[0]), int(parts[1])
        if 0 <= h < 24 and 0 <= m < 60:
            return h * 60 + m
    except Exception:
        pass
    return None


def validate_slot_data(data: Dict[str, Any], is_update: bool = False) -> Dict[str, str]:
    """
    Validate slot creation/update payload.
    Enforces format, future date, and valid time ranges.
    """
    errors = {}

    date_str = data.get("date")
    if not is_update or "date" in data:
        if not date_str or not isinstance(date_str, str):
            errors["date"] = "Date is required in YYYY-MM-DD format."
        else:
            try:
                slot_date = datetime.strptime(date_str.strip(), "%Y-%m-%d").date()
                today_utc = datetime.now(timezone.utc).date()
                if slot_date < today_utc:
                    errors["date"] = "Cannot create or move availability slot to a past date."
            except ValueError:
                errors["date"] = "Invalid date format. Expected YYYY-MM-DD."

    start_str = data.get("start_time")
    end_str = data.get("end_time")

    if not is_update or ("start_time" in data or "end_time" in data):
        start_min = parse_time_to_minutes(str(start_str or ""))
        end_min = parse_time_to_minutes(str(end_str or ""))

        if start_min is None:
            errors["start_time"] = "Start time is required in 24-hour HH:MM format."
        if end_min is None:
            errors["end_time"] = "End time is required in 24-hour HH:MM format."

        if start_min is not None and end_min is not None:
            if start_min >= end_min:
                errors["time_range"] = "Start time must be strictly before end time."

    if "teaching_mode" in data:
        mode = str(data.get("teaching_mode", "")).strip().upper()
        if mode not in VALID_TEACHING_MODES:
            errors["teaching_mode"] = f"Teaching mode must be one of {', '.join(sorted(VALID_TEACHING_MODES))}."

    if "status" in data:
        status = str(data.get("status", "")).strip().upper()
        if status not in VALID_SLOT_STATUSES:
            errors["status"] = f"Status must be one of {', '.join(sorted(VALID_SLOT_STATUSES))}."

    return errors


def check_slot_overlap(
    tutor_id: str,
    date_str: str,
    start_time: str,
    end_time: str,
    exclude_slot_id: Optional[str] = None,
) -> bool:
    """
    Check if the given time interval overlaps with any existing slot for the tutor on that date.
    Two intervals [A, B] and [C, D] overlap if A < D and B > C.
    """
    new_start = parse_time_to_minutes(start_time)
    new_end = parse_time_to_minutes(end_time)
    if new_start is None or new_end is None:
        return False

    query: Dict[str, Any] = {
        "tutor_id": str(tutor_id),
        "date": date_str.strip(),
        "status": {"$in": ["AVAILABLE", "BOOKED"]},
    }
    if exclude_slot_id:
        try:
            query["_id"] = {"$ne": ObjectId(exclude_slot_id)}
        except Exception:
            pass

    existing_slots = mongo.db.availability.find(query)
    for s in existing_slots:
        ex_start = parse_time_to_minutes(s.get("start_time", ""))
        ex_end = parse_time_to_minutes(s.get("end_time", ""))
        if ex_start is not None and ex_end is not None:
            if new_start < ex_end and new_end > ex_start:
                return True

    return False


def create_slot(user_id: str, data: Dict[str, Any]) -> Tuple[Optional[Dict], Optional[str], int]:
    """
    Create a new availability slot for an authenticated tutor.
    """
    # 1. Verify user exists and has TUTOR role
    try:
        user_oid = ObjectId(user_id)
    except Exception:
        return None, "Invalid user ID.", 400

    user = mongo.db.users.find_one({"_id": user_oid})
    if not user:
        return None, "User not found.", 404
    if str(user.get("role", "")).upper() != "TUTOR":
        return None, "Only users with the TUTOR role can create availability slots.", 403

    # 2. Validate input
    errors = validate_slot_data(data, is_update=False)
    if errors:
        first_error = next(iter(errors.values()))
        return None, first_error, 400

    date_str = data["date"].strip()
    start_time = data["start_time"].strip()
    end_time = data["end_time"].strip()
    teaching_mode = data.get("teaching_mode", "ONLINE").strip().upper()

    # 3. Check for overlaps
    if check_slot_overlap(user_id, date_str, start_time, end_time):
        return None, "This slot overlaps with an existing availability slot.", 400

    slot_doc = new_slot(
        tutor_id=user_id,
        date=date_str,
        start_time=start_time,
        end_time=end_time,
        teaching_mode=teaching_mode,
        status="AVAILABLE",
    )
    result = mongo.db.availability.insert_one(slot_doc)
    created = mongo.db.availability.find_one({"_id": result.inserted_id})
    return to_safe_slot(created, user.get("name", "")), None, 201


def get_tutor_slots(
    tutor_id: str,
    status: Optional[str] = None,
    date: Optional[str] = None,
) -> List[Dict]:
    """
    Retrieve all slots for a specific tutor with optional status and date filters.
    """
    query: Dict[str, Any] = {"tutor_id": str(tutor_id)}
    if status:
        query["status"] = status.strip().upper()
    if date:
        query["date"] = date.strip()

    tutor = None
    try:
        tutor = mongo.db.users.find_one({"_id": ObjectId(tutor_id)})
    except Exception:
        pass
    tutor_name = tutor.get("name", "") if tutor else ""

    cursor = mongo.db.availability.find(query).sort([("date", 1), ("start_time", 1)])
    return [to_safe_slot(s, tutor_name) for s in cursor]


def get_available_slots(
    tutor_id: Optional[str] = None,
    date: Optional[str] = None,
    teaching_mode: Optional[str] = None,
) -> List[Dict]:
    """
    Retrieve all available slots across tutors with optional filters.
    Excludes slots with dates strictly in the past.
    """
    today_utc_str = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    query: Dict[str, Any] = {
        "status": "AVAILABLE",
        "date": {"$gte": today_utc_str},
    }

    if tutor_id:
        query["tutor_id"] = str(tutor_id)
    if date:
        query["date"] = date.strip()
    if teaching_mode:
        norm_mode = teaching_mode.strip().upper()
        if norm_mode == "IN-PERSON" or norm_mode == "IN_PERSON":
            norm_mode = "ON_CAMPUS"
        query["teaching_mode"] = norm_mode

    slots = list(mongo.db.availability.find(query).sort([("date", 1), ("start_time", 1)]))

    # Batch load tutor names
    all_tids = list({s.get("tutor_id") for s in slots if s.get("tutor_id")})
    valid_oids = []
    for tid in all_tids:
        try:
            valid_oids.append(ObjectId(tid))
        except Exception:
            pass

    tutor_map = {}
    if valid_oids:
        users = mongo.db.users.find({"_id": {"$in": valid_oids}}, {"name": 1})
        tutor_map = {str(u["_id"]): u.get("name", "") for u in users}

    return [to_safe_slot(s, tutor_map.get(str(s.get("tutor_id", "")), "")) for s in slots]


def update_slot(user_id: str, slot_id: str, data: Dict[str, Any]) -> Tuple[Optional[Dict], Optional[str], int]:
    """
    Update an existing availability slot.
    Only the owner tutor can update it, and only if not BOOKED.
    """
    try:
        slot_oid = ObjectId(slot_id)
    except Exception:
        return None, "Invalid slot ID.", 400

    slot = mongo.db.availability.find_one({"_id": slot_oid})
    if not slot:
        return None, "Slot not found.", 404

    if str(slot.get("tutor_id", "")) != str(user_id):
        return None, "You are not authorized to edit this slot.", 403

    if slot.get("status") == "BOOKED":
        return None, "Cannot modify an already booked slot.", 400

    errors = validate_slot_data(data, is_update=True)
    if errors:
        first_error = next(iter(errors.values()))
        return None, first_error, 400

    date_str = data.get("date", slot["date"]).strip()
    start_time = data.get("start_time", slot["start_time"]).strip()
    end_time = data.get("end_time", slot["end_time"]).strip()

    # Check overlaps if timing changed
    if check_slot_overlap(user_id, date_str, start_time, end_time, exclude_slot_id=slot_id):
        return None, "Updated slot overlaps with another existing slot.", 400

    update_fields: Dict[str, Any] = {"updated_at": datetime.now(timezone.utc)}
    if "date" in data:
        update_fields["date"] = date_str
    if "start_time" in data:
        update_fields["start_time"] = start_time
    if "end_time" in data:
        update_fields["end_time"] = end_time
    if "teaching_mode" in data:
        update_fields["teaching_mode"] = data["teaching_mode"].strip().upper()
    if "status" in data:
        new_status = data["status"].strip().upper()
        if new_status in ("AVAILABLE", "UNAVAILABLE"):
            update_fields["status"] = new_status

    mongo.db.availability.update_one({"_id": slot_oid}, {"$set": update_fields})
    updated = mongo.db.availability.find_one({"_id": slot_oid})

    user = mongo.db.users.find_one({"_id": ObjectId(user_id)})
    return to_safe_slot(updated, user.get("name", "") if user else ""), None, 200


def delete_slot(user_id: str, slot_id: str) -> Tuple[bool, Optional[str], int]:
    """
    Delete an availability slot.
    Only the owner tutor can delete it. Rejects deletion if slot is BOOKED.
    """
    try:
        slot_oid = ObjectId(slot_id)
    except Exception:
        return False, "Invalid slot ID.", 400

    slot = mongo.db.availability.find_one({"_id": slot_oid})
    if not slot:
        return False, "Slot not found.", 404

    if str(slot.get("tutor_id", "")) != str(user_id):
        return False, "You are not authorized to delete this slot.", 403

    if slot.get("status") == "BOOKED":
        return False, "Cannot delete an already booked slot.", 400

    # Auto-cancel or decline any lingering pending requests for this slot
    now = datetime.now(timezone.utc)
    mongo.db.session_requests.update_many(
        {"slot_id": str(slot_id), "status": "PENDING"},
        {"$set": {"status": "CANCELLED", "updated_at": now, "message": "Slot was removed by tutor."}},
    )

    mongo.db.availability.delete_one({"_id": slot_oid})
    return True, None, 200


def ensure_availability_indexes():
    """Create MongoDB indexes for availability collection."""
    try:
        mongo.db.availability.create_index([("tutor_id", 1), ("date", 1), ("status", 1)])
        mongo.db.availability.create_index([("status", 1), ("date", 1)])
        mongo.db.availability.create_index("created_at")
    except Exception as e:
        print(f"Warning: Failed to create availability indexes: {e}")
