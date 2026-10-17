"""
Focus Room and Study Sprint Model for PeerConnect.
"""
from datetime import datetime, timezone, timedelta
from typing import Any, Dict, List, Optional
from bson import ObjectId


def new_focus_room(
    title: str,
    subject: str,
    goal: str = "",
    duration_minutes: int = 25,
    host_id: str = "",
    host_name: str = "",
) -> Dict[str, Any]:
    """
    Construct a new peer study sprint room document.
    """
    now = datetime.now(timezone.utc)
    duration = max(5, min(120, int(duration_minutes)))
    expires_at = now + timedelta(minutes=duration + 30)

    host_participant = {
        "user_id": str(host_id),
        "name": host_name.strip() if host_name else "Sprint Host",
        "joined_at": now.isoformat(),
    }

    return {
        "title": title.strip(),
        "subject": subject.strip(),
        "goal": goal.strip() if goal else "High-focus study sprint",
        "duration_minutes": duration,
        "host_id": str(host_id),
        "host_name": host_name.strip() if host_name else "Sprint Host",
        "participants": [host_participant],
        "status": "ACTIVE",
        "created_at": now,
        "expires_at": expires_at,
    }


def to_public_focus_room(doc: Optional[Dict[str, Any]], current_user_id: Optional[str] = None) -> Optional[Dict[str, Any]]:
    """
    Serialize focus room document into a safe JSON representation.
    """
    if not doc:
        return None

    room_id = str(doc.get("_id", ""))
    created_at = doc.get("created_at")
    created_str = created_at.isoformat() if isinstance(created_at, datetime) else str(created_at)

    participants = doc.get("participants", [])
    participant_uids = [str(p.get("user_id", "")) for p in participants]
    is_joined = False
    if current_user_id:
        is_joined = str(current_user_id) in participant_uids

    return {
        "id": room_id,
        "title": doc.get("title", ""),
        "subject": doc.get("subject", ""),
        "goal": doc.get("goal", ""),
        "duration_minutes": int(doc.get("duration_minutes", 25)),
        "host_id": doc.get("host_id", ""),
        "host_name": doc.get("host_name", "Sprint Host"),
        "participants_count": len(participants),
        "participants": participants,
        "status": doc.get("status", "ACTIVE"),
        "is_joined": is_joined,
        "created_at": created_str,
    }
