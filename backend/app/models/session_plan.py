"""
Session Plan & Confidence Tracker Model for PeerConnect.
"""
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from bson import ObjectId


def new_session_plan(request_id: str) -> Dict[str, Any]:
    """
    Construct a new structured session plan linked to a session booking.
    """
    now = datetime.now(timezone.utc)
    return {
        "request_id": str(request_id),
        "objectives": "",
        "difficult_concepts": "",
        "agenda_items": [
            {"id": "a1", "text": "Review prior coursework & baseline questions", "completed": False},
            {"id": "a2", "text": "Guided problem walkthrough & core concepts", "completed": False},
            {"id": "a3", "text": "Independent practice & Q&A", "completed": False},
        ],
        "follow_up_tasks": [],
        "pre_confidence": None,
        "post_confidence": None,
        "confidence_notes": "",
        "created_at": now,
        "updated_at": now,
    }


def to_public_session_plan(doc: Optional[Dict[str, Any]]) -> Optional[Dict[str, Any]]:
    """
    Serialize session plan document into a safe JSON dictionary.
    """
    if not doc:
        return None

    updated_at = doc.get("updated_at")
    updated_str = updated_at.isoformat() if isinstance(updated_at, datetime) else str(updated_at)

    return {
        "id": str(doc.get("_id", "")),
        "request_id": str(doc.get("request_id", "")),
        "objectives": doc.get("objectives", ""),
        "difficult_concepts": doc.get("difficult_concepts", ""),
        "agenda_items": doc.get("agenda_items", []),
        "follow_up_tasks": doc.get("follow_up_tasks", []),
        "pre_confidence": doc.get("pre_confidence"),
        "post_confidence": doc.get("post_confidence"),
        "confidence_notes": doc.get("confidence_notes", ""),
        "updated_at": updated_str,
    }
