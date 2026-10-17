"""
Proof-of-Skill Portfolio Model for PeerConnect.
"""
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from bson import ObjectId


def new_portfolio(user_id: str) -> Dict[str, Any]:
    """
    Construct a new skill portfolio document for a user.
    """
    now = datetime.now(timezone.utc)
    return {
        "user_id": str(user_id),
        "headline": "Aspiring Peer Scholar",
        "bio_summary": "",
        "skills": ["Problem Solving", "Peer Collaboration"],
        "projects": [],
        "is_public": True,
        "created_at": now,
        "updated_at": now,
    }


def to_public_portfolio(
    doc: Optional[Dict[str, Any]],
    user_doc: Optional[Dict[str, Any]] = None,
    verified_achievements: Optional[List[Dict[str, Any]]] = None,
) -> Optional[Dict[str, Any]]:
    """
    Serialize portfolio document into safe JSON.
    """
    if not doc:
        return None

    updated_at = doc.get("updated_at")
    updated_str = updated_at.isoformat() if isinstance(updated_at, datetime) else str(updated_at)

    u_name = user_doc.get("name", "Peer Member") if user_doc else "Peer Member"
    u_role = user_doc.get("role", "STUDENT") if user_doc else "STUDENT"
    u_campus = user_doc.get("campus", "") if user_doc else ""

    return {
        "id": str(doc.get("_id", "")),
        "user_id": str(doc.get("user_id", "")),
        "user_name": u_name,
        "user_role": u_role,
        "campus": u_campus,
        "headline": doc.get("headline", "Peer Scholar"),
        "bio_summary": doc.get("bio_summary", ""),
        "skills": doc.get("skills", []),
        "projects": doc.get("projects", []),
        "is_public": bool(doc.get("is_public", True)),
        "verified_achievements": verified_achievements or [],
        "updated_at": updated_str,
    }
