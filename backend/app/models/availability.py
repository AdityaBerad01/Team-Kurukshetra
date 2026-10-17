"""
Availability model schema and serialization helpers for PeerConnect.
"""
from datetime import datetime, timezone
from typing import Any, Dict, Optional

VALID_SLOT_STATUSES = {"AVAILABLE", "BOOKED", "UNAVAILABLE"}
VALID_TEACHING_MODES = {"ONLINE", "ON_CAMPUS"}


def new_slot(
    tutor_id: str,
    date: str,
    start_time: str,
    end_time: str,
    teaching_mode: str = "ONLINE",
    status: str = "AVAILABLE",
) -> Dict[str, Any]:
    """
    Build a new availability slot document for MongoDB insertion.
    """
    now = datetime.now(timezone.utc)
    return {
        "tutor_id": str(tutor_id),
        "date": date.strip(),
        "start_time": start_time.strip(),
        "end_time": end_time.strip(),
        "teaching_mode": teaching_mode.strip().upper(),
        "status": status.strip().upper(),
        "created_at": now,
        "updated_at": now,
    }


def to_safe_slot(slot_doc: Optional[Dict[str, Any]], tutor_name: str = "") -> Optional[Dict[str, Any]]:
    """
    Serialize an availability slot document for API responses.
    """
    if not slot_doc:
        return None

    created_at = slot_doc.get("created_at")
    updated_at = slot_doc.get("updated_at")
    created_str = created_at.isoformat() if isinstance(created_at, datetime) else str(created_at or "")
    updated_str = updated_at.isoformat() if isinstance(updated_at, datetime) else str(updated_at or "")

    mode_raw = slot_doc.get("teaching_mode", "ONLINE")
    mode_label = "Online" if mode_raw == "ONLINE" else "In-person"

    return {
        "id": str(slot_doc.get("_id", "")),
        "tutor_id": str(slot_doc.get("tutor_id", "")),
        "tutor_name": tutor_name,
        "date": slot_doc.get("date", ""),
        "start_time": slot_doc.get("start_time", ""),
        "end_time": slot_doc.get("end_time", ""),
        "teaching_mode": mode_raw,
        "mode": mode_label,
        "status": slot_doc.get("status", "AVAILABLE"),
        "created_at": created_str,
        "updated_at": updated_str,
    }
