"""
Resource Model Schema and Serialization for PeerConnect Community Exchange.
"""
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from bson import ObjectId

VALID_RESOURCE_TYPES = {"LINK", "NOTE", "DOCUMENT"}


def new_resource(
    title: str,
    description: str,
    subject: str,
    topic: str = "",
    language: str = "English",
    resource_type: str = "LINK",
    url: str = "",
    content: str = "",
    author_id: str = "",
    author_name: str = "",
    tags: Optional[List[str]] = None,
) -> Dict[str, Any]:
    """
    Construct a new study resource document for MongoDB.
    """
    now = datetime.now(timezone.utc)
    norm_type = resource_type.strip().upper()
    if norm_type not in VALID_RESOURCE_TYPES:
        norm_type = "LINK"

    return {
        "title": title.strip(),
        "description": description.strip(),
        "subject": subject.strip(),
        "topic": topic.strip() if topic else subject.strip(),
        "language": language.strip() if language else "English",
        "resource_type": norm_type,
        "url": url.strip() if url else "",
        "content": content.strip() if content else "",
        "author_id": str(author_id),
        "author_name": author_name.strip() if author_name else "Peer Student",
        "tags": [t.strip() for t in (tags or []) if t.strip()],
        "upvotes": 0,
        "upvoted_by": [],
        "is_active": True,
        "created_at": now,
        "updated_at": now,
    }


def to_public_resource(doc: Optional[Dict[str, Any]], current_user_id: Optional[str] = None) -> Optional[Dict[str, Any]]:
    """
    Serialize resource document into a safe JSON dictionary.
    """
    if not doc:
        return None

    r_id = str(doc.get("_id", ""))
    created_at = doc.get("created_at")
    created_str = created_at.isoformat() if isinstance(created_at, datetime) else str(created_at)

    upvoted_by = [str(uid) for uid in doc.get("upvoted_by", [])]
    has_upvoted = False
    if current_user_id:
        has_upvoted = str(current_user_id) in upvoted_by

    return {
        "id": r_id,
        "title": doc.get("title", ""),
        "description": doc.get("description", ""),
        "subject": doc.get("subject", ""),
        "topic": doc.get("topic", ""),
        "language": doc.get("language", "English"),
        "resource_type": doc.get("resource_type", "LINK"),
        "url": doc.get("url", ""),
        "content": doc.get("content", ""),
        "author_id": doc.get("author_id", ""),
        "author_name": doc.get("author_name", "Peer Student"),
        "tags": doc.get("tags", []),
        "upvotes": int(doc.get("upvotes", 0)),
        "has_upvoted": has_upvoted,
        "created_at": created_str,
    }
