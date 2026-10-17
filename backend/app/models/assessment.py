"""
Assessment and Learning Progress model for PeerConnect.
Supports pre-session and post-session quizzes with auto-grading and score improvement analytics.
"""
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
import uuid


def new_assessment(
    title: str,
    subject: str,
    tutor_id: str,
    student_id: str,
    assessment_type: str = "PRE_SESSION",
    questions: Optional[List[Dict[str, Any]]] = None,
    session_id: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Construct a new assessment quiz document.
    """
    now = datetime.now(timezone.utc)
    return {
        "title": title.strip(),
        "subject": subject.strip(),
        "tutor_id": str(tutor_id),
        "student_id": str(student_id),
        "session_id": str(session_id) if session_id else None,
        "assessment_type": assessment_type.strip().upper(),
        "questions": questions or [],
        "status": "ASSIGNED",
        "student_answers": {},
        "score": None,
        "created_at": now,
        "submitted_at": None,
    }


def to_safe_assessment(doc: Optional[Dict[str, Any]], mask_answers: bool = True) -> Optional[Dict[str, Any]]:
    """
    Serialize an assessment for client consumption.
    If mask_answers is True and quiz is still ASSIGNED, correct options are masked.
    """
    if not doc:
        return None

    created_at = doc.get("created_at")
    submitted_at = doc.get("submitted_at")
    created_str = created_at.isoformat() if isinstance(created_at, datetime) else str(created_at or "")
    submitted_str = submitted_at.isoformat() if isinstance(submitted_at, datetime) else (str(submitted_at) if submitted_at else None)

    is_submitted = doc.get("status") == "SUBMITTED"
    raw_questions = doc.get("questions", [])

    safe_questions = []
    for q in raw_questions:
        q_copy = {
            "id": q.get("id", str(uuid.uuid4())[:8]),
            "question": q.get("question", ""),
            "options": q.get("options", []),
        }
        if is_submitted or not mask_answers:
            q_copy["correct_index"] = q.get("correct_index", 0)
            q_copy["explanation"] = q.get("explanation", "")
        safe_questions.append(q_copy)

    return {
        "id": str(doc.get("_id", "")),
        "title": doc.get("title", ""),
        "subject": doc.get("subject", ""),
        "tutor_id": str(doc.get("tutor_id", "")),
        "student_id": str(doc.get("student_id", "")),
        "session_id": doc.get("session_id"),
        "assessment_type": doc.get("assessment_type", "PRE_SESSION"),
        "status": doc.get("status", "ASSIGNED"),
        "score": doc.get("score"),
        "questions": safe_questions,
        "student_answers": doc.get("student_answers", {}),
        "created_at": created_str,
        "submitted_at": submitted_str,
    }
