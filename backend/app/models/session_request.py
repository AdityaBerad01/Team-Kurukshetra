"""
Session request model schema and serialization helpers for PeerConnect.
"""
from datetime import datetime, timezone
from typing import Any, Dict, Optional

VALID_REQUEST_STATUSES = {"PENDING", "ACCEPTED", "DECLINED", "CANCELLED"}


def new_session_request(
    student_id: str,
    tutor_id: str,
    slot_id: str,
    subject: str,
    message: str = "",
    status: str = "PENDING",
) -> Dict[str, Any]:
    """
    Build a new session request document for MongoDB insertion.
    """
    now = datetime.now(timezone.utc)
    return {
        "student_id": str(student_id),
        "tutor_id": str(tutor_id),
        "slot_id": str(slot_id),
        "subject": subject.strip(),
        "message": message.strip() if message else "",
        "status": status.strip().upper(),
        "created_at": now,
        "updated_at": now,
    }


def to_safe_request(
    req_doc: Optional[Dict[str, Any]],
    student_name: str = "",
    tutor_name: str = "",
    slot_info: Optional[Dict[str, Any]] = None,
) -> Optional[Dict[str, Any]]:
    """
    Serialize a session request document for API responses,
    optionally enriched with student/tutor names and slot timing.
    """
    if not req_doc:
        return None

    from app.models.user import generate_initials

    created_at = req_doc.get("created_at")
    updated_at = req_doc.get("updated_at")
    created_str = created_at.isoformat() if isinstance(created_at, datetime) else str(created_at or "")
    updated_str = updated_at.isoformat() if isinstance(updated_at, datetime) else str(updated_at or "")

    slot = slot_info or {}
    mode_raw = slot.get("teaching_mode", "ONLINE")
    mode_label = "Online" if mode_raw == "ONLINE" else "In-person"

    # Calculate duration in minutes if slot has start_time and end_time
    duration = 60
    start_time = slot.get("start_time", "")
    end_time = slot.get("end_time", "")
    if start_time and end_time:
        try:
            sh, sm = map(int, start_time.split(":"))
            eh, em = map(int, end_time.split(":"))
            duration = (eh * 60 + em) - (sh * 60 + sm)
        except Exception:
            duration = 60

    status = req_doc.get("status", "PENDING").upper()
    status_lower = status.lower()
    # Map for UI card compatibility: accepted -> confirmed, declined -> rejected
    ui_status = "confirmed" if status == "ACCEPTED" else ("rejected" if status == "DECLINED" else status_lower)

    return {
        "id": str(req_doc.get("_id", "")),
        "student_id": str(req_doc.get("student_id", "")),
        "studentName": student_name,
        "studentInitials": generate_initials(student_name),
        "tutor_id": str(req_doc.get("tutor_id", "")),
        "tutorName": tutor_name,
        "tutorInitials": generate_initials(tutor_name),
        "slot_id": str(req_doc.get("slot_id", "")),
        "subject": req_doc.get("subject", ""),
        "topic": req_doc.get("subject", ""),
        "message": req_doc.get("message", ""),
        "notes": req_doc.get("message", ""),
        "status": status,
        "ui_status": ui_status,
        "date": slot.get("date", ""),
        "time": f"{start_time} - {end_time}" if start_time else "",
        "start_time": start_time,
        "end_time": end_time,
        "duration": duration,
        "mode": mode_label,
        "teaching_mode": mode_raw,
        "created_at": created_str,
        "updated_at": updated_str,
    }
