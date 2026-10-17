"""
User model schema and serialization helpers for PeerConnect.
Provides document creation, email validation, and safe dictionary serialization.
"""
import re
from datetime import datetime, timezone
from typing import Any, Dict, Optional

# Valid roles supported by the platform
VALID_ROLES = {"STUDENT", "TUTOR"}

EMAIL_REGEX = re.compile(
    r"^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$"
)


def normalize_email(email: str) -> str:
    """Normalize email by trimming and lowercasing."""
    if not email:
        return ""
    return email.strip().lower()


def validate_email_format(email: str) -> bool:
    """Validate email address format using RFC-compliant pattern."""
    if not email or not isinstance(email, str):
        return False
    normalized = normalize_email(email)
    return bool(EMAIL_REGEX.match(normalized))


def generate_initials(name: str) -> str:
    """Extract up to two uppercase initials from a user's display name."""
    if not name:
        return "U"
    parts = name.strip().split()
    if len(parts) >= 2:
        return f"{parts[0][0]}{parts[-1][0]}".upper()
    return name.strip()[:2].upper()


def new_user(
    name: str,
    email: str,
    password_hash: str,
    role: str = "STUDENT",
    university: str = "",
    subjects: Optional[list] = None,
    bio: str = "",
    credits: int = 100,
    languages: Optional[list] = None,
    campus: str = "",
    learning_goals: str = "",
    skill_level: str = "Intermediate",
    subjects_to_learn: Optional[list] = None,
) -> Dict[str, Any]:
    """
    Build a new user document for MongoDB insertion.
    """
    normalized_role = role.strip().upper()
    now = datetime.now(timezone.utc)
    resolved_campus = campus.strip() if campus else (university.strip() if university else "")

    return {
        "name": name.strip(),
        "email": normalize_email(email),
        "password_hash": password_hash,
        "role": normalized_role,
        "university": university.strip() if university else "",
        "campus": resolved_campus,
        "subjects": subjects or [],
        "bio": bio.strip() if bio else "",
        "credits": max(0, int(credits)),
        "languages": languages or ["English"],
        "learning_goals": learning_goals.strip() if learning_goals else "",
        "skill_level": skill_level.strip() if skill_level else "Intermediate",
        "subjects_to_learn": subjects_to_learn or [],
        "is_active": True,
        "created_at": now,
        "updated_at": now,
    }


def to_safe_user(user_doc: Optional[Dict[str, Any]]) -> Optional[Dict[str, Any]]:
    """
    Serialize a MongoDB user document into a safe dictionary for API responses.
    """
    if not user_doc:
        return None

    user_id = str(user_doc.get("_id", ""))
    name = user_doc.get("name", "")
    created_at = user_doc.get("created_at")
    if isinstance(created_at, datetime):
        created_at_iso = created_at.isoformat()
    else:
        created_at_iso = str(created_at) if created_at else None

    return {
        "id": user_id,
        "name": name,
        "email": user_doc.get("email", ""),
        "role": user_doc.get("role", "STUDENT"),
        "initials": generate_initials(name),
        "university": user_doc.get("university", ""),
        "campus": user_doc.get("campus", user_doc.get("university", "")),
        "subjects": user_doc.get("subjects", []),
        "bio": user_doc.get("bio", ""),
        "credits": int(user_doc.get("credits", 100)),
        "languages": user_doc.get("languages", ["English"]),
        "learning_goals": user_doc.get("learning_goals", ""),
        "skill_level": user_doc.get("skill_level", "Intermediate"),
        "subjects_to_learn": user_doc.get("subjects_to_learn", []),
        "is_active": user_doc.get("is_active", True),
        "created_at": created_at_iso,
    }
