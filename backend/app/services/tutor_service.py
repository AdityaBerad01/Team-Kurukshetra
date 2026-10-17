"""
Tutor profile service layer for PeerConnect.
Handles validation and business logic separate from Flask routes.
"""
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional, Tuple

from bson import ObjectId

from app.extensions import mongo
from app.models.tutor_profile import (
    VALID_TEACHING_MODES,
    new_tutor_profile,
    to_public_tutor,
)


def validate_profile_data(data: Dict[str, Any], is_update: bool = False) -> Dict[str, str]:
    """
    Validate tutor profile creation/update payload.
    Returns a dict of field -> error message. Empty dict means valid.
    """
    errors = {}

    if not is_update or "subjects" in data:
        subjects = data.get("subjects")
        if not subjects or not isinstance(subjects, list) or len(subjects) == 0:
            errors["subjects"] = "At least one subject is required."
        elif not all(isinstance(s, str) and s.strip() for s in subjects):
            errors["subjects"] = "Each subject must be a non-empty text string."

    if "teaching_modes" in data:
        teaching_modes = data.get("teaching_modes")
        if not isinstance(teaching_modes, list) or len(teaching_modes) == 0:
            errors["teaching_modes"] = "At least one teaching mode is required (ONLINE or ON_CAMPUS)."
        else:
            normalized = [m.strip().upper() for m in teaching_modes if isinstance(m, str) and m.strip()]
            invalid = [m for m in normalized if m not in VALID_TEACHING_MODES]
            if invalid:
                errors["teaching_modes"] = (
                    f"Invalid teaching mode(s): {', '.join(invalid)}. "
                    f"Supported: {', '.join(sorted(VALID_TEACHING_MODES))}."
                )

    return errors


def create_profile(user_id: str, data: Dict[str, Any]) -> Tuple[Optional[Dict], Optional[str], int]:
    """
    Create a new tutor profile.
    Returns (profile_dict, error_message, http_status_code).
    """
    try:
        user_oid = ObjectId(user_id)
    except Exception:
        return None, "Invalid user ID.", 400

    user = mongo.db.users.find_one({"_id": user_oid})
    if not user:
        return None, "User not found.", 404

    # Requirement: Only authenticated TUTOR users can create or edit their own profile
    if str(user.get("role", "")).upper() != "TUTOR":
        return None, "Only authenticated users with the TUTOR role can create a tutor profile.", 403

    # Check for existing profile
    existing = mongo.db.tutor_profiles.find_one({"user_id": str(user_id)})
    if existing:
        return None, "Tutor profile already exists. Use PUT /api/tutors/profile/me to update.", 409

    # Service-layer validation
    errors = validate_profile_data(data, is_update=False)
    if errors:
        first_error = next(iter(errors.values()))
        return None, first_error, 400

    teaching_modes = data.get("teaching_modes", ["ONLINE"])
    normalized_modes = [m.strip().upper() for m in teaching_modes if isinstance(m, str) and m.strip()]

    doc = new_tutor_profile(
        user_id=str(user_id),
        subjects=data.get("subjects", []),
        introduction=data.get("introduction", ""),
        department=data.get("department", ""),
        year_of_study=data.get("year_of_study", ""),
        teaching_modes=normalized_modes,
        hourly_rate=data.get("hourly_rate", 300),
        availability=data.get("availability"),
    )
    result = mongo.db.tutor_profiles.insert_one(doc)
    created = mongo.db.tutor_profiles.find_one({"_id": result.inserted_id})
    return to_public_tutor(created, user), None, 201


def update_profile(user_id: str, data: Dict[str, Any]) -> Tuple[Optional[Dict], Optional[str], int]:
    """
    Update an existing tutor profile.
    Returns (profile_dict, error_message, http_status_code).
    """
    try:
        user_oid = ObjectId(user_id)
    except Exception:
        return None, "Invalid user ID.", 400

    user = mongo.db.users.find_one({"_id": user_oid})
    if not user:
        return None, "User not found.", 404

    if str(user.get("role", "")).upper() != "TUTOR":
        return None, "Only users with the TUTOR role can modify a tutor profile.", 403

    profile = mongo.db.tutor_profiles.find_one({"user_id": str(user_id)})
    if not profile:
        return None, "Tutor profile not found. Please create your profile first.", 404

    # Validate update payload
    errors = validate_profile_data(data, is_update=True)
    if errors:
        first_error = next(iter(errors.values()))
        return None, first_error, 400

    update_fields: Dict[str, Any] = {}
    if "subjects" in data:
        update_fields["subjects"] = [s.strip() for s in data["subjects"] if isinstance(s, str) and s.strip()]
    if "introduction" in data:
        update_fields["introduction"] = str(data["introduction"]).strip()
    if "department" in data:
        update_fields["department"] = str(data["department"]).strip()
    if "year_of_study" in data:
        update_fields["year_of_study"] = str(data["year_of_study"]).strip()
    if "teaching_modes" in data:
        update_fields["teaching_modes"] = [
            m.strip().upper() for m in data["teaching_modes"] if isinstance(m, str) and m.strip()
        ]
    if "hourly_rate" in data:
        update_fields["hourly_rate"] = max(0, int(data["hourly_rate"]))
    if "availability" in data and isinstance(data["availability"], list):
        update_fields["availability"] = data["availability"]

    update_fields["updated_at"] = datetime.now(timezone.utc)

    mongo.db.tutor_profiles.update_one(
        {"_id": profile["_id"]},
        {"$set": update_fields},
    )

    updated = mongo.db.tutor_profiles.find_one({"_id": profile["_id"]})
    return to_public_tutor(updated, user), None, 200


def get_own_profile(user_id: str) -> Optional[Dict]:
    """
    Retrieve the authenticated tutor's own profile.
    """
    try:
        user_oid = ObjectId(user_id)
    except Exception:
        return None

    profile = mongo.db.tutor_profiles.find_one({"user_id": str(user_id)})
    if not profile:
        return None
    user = mongo.db.users.find_one({"_id": user_oid})
    return to_public_tutor(profile, user)


def get_tutor_by_id(profile_id: str) -> Optional[Dict]:
    """
    Retrieve a single tutor profile by its document ID or associated user ID.
    """
    profile = None
    try:
        profile = mongo.db.tutor_profiles.find_one({"_id": ObjectId(profile_id)})
    except Exception:
        pass

    if not profile:
        profile = mongo.db.tutor_profiles.find_one({"user_id": profile_id})

    if not profile:
        return None

    user = None
    try:
        user = mongo.db.users.find_one({"_id": ObjectId(profile.get("user_id", ""))})
    except Exception:
        pass

    return to_public_tutor(profile, user)


def search_tutors(
    query: str = "",
    subject: str = "",
    teaching_mode: str = "",
    availability_date: str = "",
    page: int = 1,
    per_page: int = 12,
) -> Tuple[List[Dict], int]:
    """
    Search and filter tutor profiles with pagination.
    Returns (list_of_tutor_dicts, total_count).
    """
    mongo_filter: Dict[str, Any] = {}

    # Subject filter
    if subject and subject.strip():
        mongo_filter["subjects"] = {"$regex": subject.strip(), "$options": "i"}

    # Teaching mode filter (ONLINE or ON_CAMPUS)
    if teaching_mode and teaching_mode.strip():
        norm_mode = teaching_mode.strip().upper()
        if norm_mode == "IN-PERSON" or norm_mode == "IN_PERSON":
            norm_mode = "ON_CAMPUS"
        if norm_mode in VALID_TEACHING_MODES:
            mongo_filter["teaching_modes"] = norm_mode

    # Availability date filter
    if availability_date and availability_date.strip():
        date_str = availability_date.strip()
        weekday_name = ""
        try:
            dt = datetime.strptime(date_str, "%Y-%m-%d")
            weekday_name = dt.strftime("%A")
        except Exception:
            pass

        date_conditions = [{"availability": date_str}]
        if weekday_name:
            date_conditions.append({"availability": weekday_name})

        mongo_filter["$or"] = date_conditions

    # Query search (tutor name or subject or introduction)
    if query and query.strip():
        q = query.strip()
        # Find user IDs whose name matches
        matching_users = mongo.db.users.find(
            {"name": {"$regex": q, "$options": "i"}, "role": "TUTOR"},
            {"_id": 1},
        )
        user_ids_from_name = [str(u["_id"]) for u in matching_users]

        # Also search tutor profiles by subject or introduction
        query_conditions: List[Dict[str, Any]] = [
            {"subjects": {"$regex": q, "$options": "i"}},
            {"introduction": {"$regex": q, "$options": "i"}},
        ]
        if user_ids_from_name:
            query_conditions.append({"user_id": {"$in": user_ids_from_name}})

        if "$or" in mongo_filter:
            mongo_filter["$and"] = [{"$or": mongo_filter.pop("$or")}, {"$or": query_conditions}]
        else:
            mongo_filter["$or"] = query_conditions

    total = mongo.db.tutor_profiles.count_documents(mongo_filter)

    page = max(1, int(page))
    per_page = max(1, min(100, int(per_page)))
    skip = (page - 1) * per_page

    profiles = list(
        mongo.db.tutor_profiles.find(mongo_filter)
        .sort("created_at", -1)
        .skip(skip)
        .limit(per_page)
    )

    # Batch load user docs
    all_uids = [p.get("user_id") for p in profiles if p.get("user_id")]
    valid_oids = []
    for uid in all_uids:
        try:
            valid_oids.append(ObjectId(uid))
        except Exception:
            pass

    users_map = {}
    if valid_oids:
        users_cursor = mongo.db.users.find(
            {"_id": {"$in": valid_oids}},
            {"password_hash": 0, "email": 0},
        )
        users_map = {str(u["_id"]): u for u in users_cursor}

    results = []
    for p in profiles:
        user_doc = users_map.get(str(p.get("user_id", "")))
        results.append(to_public_tutor(p, user_doc))

    return results, total


def ensure_indexes():
    """
    Create MongoDB indexes for common tutor profile queries.
    """
    try:
        mongo.db.tutor_profiles.create_index("user_id", unique=True)
        mongo.db.tutor_profiles.create_index("subjects")
        mongo.db.tutor_profiles.create_index("teaching_modes")
        mongo.db.tutor_profiles.create_index("availability")
        mongo.db.tutor_profiles.create_index("created_at")
        mongo.db.tutor_profiles.create_index([("subjects", 1), ("teaching_modes", 1)])
    except Exception as e:
        print(f"Warning: Failed to create mongo indexes: {e}")
