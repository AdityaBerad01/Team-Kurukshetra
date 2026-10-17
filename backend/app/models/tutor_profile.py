"""
Tutor profile model schema and serialization helpers for PeerConnect.
"""
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

# Supported teaching modes
VALID_TEACHING_MODES = {"ONLINE", "ON_CAMPUS"}


def new_tutor_profile(
    user_id: str,
    subjects: List[str],
    introduction: str = "",
    department: str = "",
    year_of_study: str = "",
    teaching_modes: Optional[List[str]] = None,
    hourly_rate: int = 0,
    availability: Optional[List[str]] = None,
) -> Dict[str, Any]:
    """
    Build a new tutor profile document for MongoDB insertion.
    """
    now = datetime.now(timezone.utc)
    return {
        "user_id": user_id,
        "subjects": [s.strip() for s in subjects if s.strip()],
        "introduction": introduction.strip() if introduction else "",
        "department": department.strip() if department else "",
        "year_of_study": year_of_study.strip() if year_of_study else "",
        "teaching_modes": [m.strip().upper() for m in (teaching_modes or []) if m.strip()],
        "hourly_rate": max(0, int(hourly_rate or 0)),
        "availability": availability or ["Monday", "Wednesday", "Friday"],
        "created_at": now,
        "updated_at": now,
    }


def to_public_tutor(profile_doc: Optional[Dict], user_doc: Optional[Dict] = None) -> Optional[Dict]:
    """
    Serialize a tutor profile + user document into a public-safe dictionary.
    Excludes password hashes, emails, and internal fields.
    """
    if not profile_doc:
        return None

    from app.models.user import generate_initials

    profile_id = str(profile_doc.get("_id", ""))
    user_id = str(profile_doc.get("user_id", ""))

    name = ""
    initials = ""
    university = ""
    if user_doc:
        name = user_doc.get("name", "")
        initials = generate_initials(name)
        university = user_doc.get("university", "")

    created_at = profile_doc.get("created_at")
    updated_at = profile_doc.get("updated_at")
    created_str = created_at.isoformat() if isinstance(created_at, datetime) else str(created_at or "")
    updated_str = updated_at.isoformat() if isinstance(updated_at, datetime) else str(updated_at or "")

    # Map teaching modes to display labels for frontend
    mode_labels = []
    for m in profile_doc.get("teaching_modes", []):
        if m == "ONLINE":
            mode_labels.append("Online")
        elif m == "ON_CAMPUS":
            mode_labels.append("In-person")
        else:
            mode_labels.append(m)

    return {
        "id": profile_id,
        "user_id": user_id,
        "name": name,
        "initials": initials,
        "university": university,
        "subjects": profile_doc.get("subjects", []),
        "introduction": profile_doc.get("introduction", ""),
        "bio": profile_doc.get("introduction", ""),  # Alias for frontend card compatibility
        "department": profile_doc.get("department", ""),
        "year_of_study": profile_doc.get("year_of_study", ""),
        "teaching_modes": profile_doc.get("teaching_modes", []),
        "mode": mode_labels if mode_labels else ["Online"],
        "hourly_rate": profile_doc.get("hourly_rate", 300),
        "hourlyRate": profile_doc.get("hourly_rate", 300),
        "currency": "₹",
        "availability": profile_doc.get("availability", ["Monday", "Wednesday", "Friday"]),
        "rating": 4.9,
        "reviewCount": 0,
        "reviews": [],
        "verified": True,
        "created_at": created_str,
        "updated_at": updated_str,
    }
