"""
Focus Service for PeerConnect Study Rooms & Pomodoro Sprints.
"""
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional, Tuple
from bson import ObjectId

from app import mongo
from app.models.focus_room import new_focus_room, to_public_focus_room


def create_room(user_id: str, data: Dict[str, Any]) -> Tuple[Optional[Dict], Optional[str], int]:
    """
    Host creates a new collaborative focus sprint room.
    """
    title = str(data.get("title", "")).strip()
    subject = str(data.get("subject", "")).strip()
    goal = str(data.get("goal", "")).strip()
    try:
        duration = int(data.get("duration_minutes", 25))
    except (ValueError, TypeError):
        duration = 25

    if not title or len(title) < 3:
        return None, "Title must be at least 3 characters.", 400
    if not subject:
        return None, "Subject is required.", 400

    host_name = "Sprint Host"
    try:
        user_doc = mongo.db.users.find_one({"_id": ObjectId(user_id)})
        if user_doc:
            host_name = user_doc.get("name", "Sprint Host")
    except Exception:
        pass

    room_doc = new_focus_room(
        title=title,
        subject=subject,
        goal=goal,
        duration_minutes=duration,
        host_id=user_id,
        host_name=host_name,
    )

    result = mongo.db.focus_rooms.insert_one(room_doc)
    room_doc["_id"] = result.inserted_id
    return to_public_focus_room(room_doc, current_user_id=user_id), None, 201


def get_active_rooms(current_user_id: Optional[str] = None) -> List[Dict[str, Any]]:
    """
    Retrieve all active focus rooms that have not expired.
    """
    now = datetime.now(timezone.utc)
    cursor = mongo.db.focus_rooms.find({
        "status": "ACTIVE",
        "expires_at": {"$gte": now},
    }).sort("created_at", -1)

    return [to_public_focus_room(doc, current_user_id=current_user_id) for doc in cursor]


def join_room(user_id: str, room_id: str) -> Tuple[Optional[Dict], Optional[str], int]:
    """
    Join an active focus study room.
    """
    try:
        r_oid = ObjectId(room_id)
    except Exception:
        return None, "Invalid room ID format.", 400

    room = mongo.db.focus_rooms.find_one({"_id": r_oid, "status": "ACTIVE"})
    if not room:
        return None, "Focus room not found or no longer active.", 404

    # Check capacity (max 20 per room)
    participants = room.get("participants", [])
    if len(participants) >= 20:
        return None, "This focus room has reached maximum capacity.", 400

    user_name = "Peer Student"
    try:
        user_doc = mongo.db.users.find_one({"_id": ObjectId(user_id)})
        if user_doc:
            user_name = user_doc.get("name", "Peer Student")
    except Exception:
        pass

    now_iso = datetime.now(timezone.utc).isoformat()
    u_str = str(user_id)

    # Check if already joined
    if any(str(p.get("user_id", "")) == u_str for p in participants):
        return to_public_focus_room(room, current_user_id=user_id), None, 200

    new_participant = {
        "user_id": u_str,
        "name": user_name,
        "joined_at": now_iso,
    }

    mongo.db.focus_rooms.update_one(
        {"_id": r_oid},
        {"$push": {"participants": new_participant}},
    )

    updated_room = mongo.db.focus_rooms.find_one({"_id": r_oid})
    return to_public_focus_room(updated_room, current_user_id=user_id), None, 200


def leave_room(user_id: str, room_id: str) -> Tuple[Optional[Dict], Optional[str], int]:
    """
    Leave an active focus study room.
    """
    try:
        r_oid = ObjectId(room_id)
    except Exception:
        return None, "Invalid room ID format.", 400

    u_str = str(user_id)
    mongo.db.focus_rooms.update_one(
        {"_id": r_oid},
        {"$pull": {"participants": {"user_id": u_str}}},
    )

    updated_room = mongo.db.focus_rooms.find_one({"_id": r_oid})
    if updated_room:
        return to_public_focus_room(updated_room, current_user_id=user_id), None, 200
    return None, "Room not found.", 404


def complete_sprint(
    user_id: str,
    room_id: Optional[str] = None,
    subject: str = "General Study",
    goal: str = "",
    duration_minutes: int = 25,
) -> Tuple[Optional[Dict], Optional[str], int]:
    """
    Log an accomplished Pomodoro sprint session in the student's study ledger.
    """
    now = datetime.now(timezone.utc)
    duration = max(5, int(duration_minutes))

    sprint_doc = {
        "user_id": str(user_id),
        "room_id": str(room_id) if room_id else None,
        "subject": subject.strip() if subject else "General Study",
        "goal": goal.strip() if goal else "Completed focus sprint",
        "duration_minutes": duration,
        "completed_at": now,
    }

    mongo.db.focus_sprints.insert_one(sprint_doc)

    return {
        "message": f"Great work! {duration} minutes of high-focus study logged.",
        "duration_minutes": duration,
        "completed_at": now.isoformat(),
    }, None, 201


def get_my_focus_stats(user_id: str) -> Dict[str, Any]:
    """
    Retrieve user's cumulative focus stats and recent completed sprints.
    """
    u_str = str(user_id)
    sprints = list(
        mongo.db.focus_sprints.find({"user_id": u_str})
        .sort("completed_at", -1)
        .limit(10)
    )

    total_sprints = mongo.db.focus_sprints.count_documents({"user_id": u_str})
    
    # Calculate total minutes
    pipeline = [
        {"$match": {"user_id": u_str}},
        {"$group": {"_id": None, "total_minutes": {"$sum": "$duration_minutes"}}},
    ]
    agg = list(mongo.db.focus_sprints.aggregate(pipeline))
    total_minutes = agg[0]["total_minutes"] if agg else 0

    recent_list = []
    for s in sprints:
        cat = s.get("completed_at")
        cat_str = cat.isoformat() if isinstance(cat, datetime) else str(cat)
        recent_list.append({
            "id": str(s.get("_id", "")),
            "subject": s.get("subject", "General Study"),
            "goal": s.get("goal", ""),
            "duration_minutes": int(s.get("duration_minutes", 25)),
            "completed_at": cat_str,
        })

    return {
        "total_sprints": total_sprints,
        "total_minutes": total_minutes,
        "total_hours": round(total_minutes / 60, 1),
        "recent_sprints": recent_list,
    }
