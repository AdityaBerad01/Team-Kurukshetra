"""
Resource Service for PeerConnect Community Exchange.
Handles creating, filtering, searching, upvoting, and deleting educational resources.
"""
from datetime import datetime, timezone
import math
from typing import Any, Dict, List, Optional, Tuple
from bson import ObjectId

from app import mongo
from app.models.resource import new_resource, to_public_resource


def create_resource(user_id: str, data: Dict[str, Any]) -> Tuple[Optional[Dict], Optional[str], int]:
    """
    Publish a new community study resource.
    """
    title = str(data.get("title", "")).strip()
    description = str(data.get("description", "")).strip()
    subject = str(data.get("subject", "")).strip()
    topic = str(data.get("topic", "")).strip()
    language = str(data.get("language", "English")).strip()
    resource_type = str(data.get("resource_type", "LINK")).strip().upper()
    url = str(data.get("url", "")).strip()
    content = str(data.get("content", "")).strip()
    tags = data.get("tags", [])

    if not title or len(title) < 3:
        return None, "Title must be at least 3 characters.", 400
    if not subject:
        return None, "Subject is required.", 400
    if resource_type == "LINK" and not url:
        return None, "A valid resource URL is required for web links.", 400

    # Retrieve author name
    author_name = "Peer Student"
    try:
        user_doc = mongo.db.users.find_one({"_id": ObjectId(user_id)})
        if user_doc:
            author_name = user_doc.get("name", "Peer Student")
    except Exception:
        pass

    doc = new_resource(
        title=title,
        description=description,
        subject=subject,
        topic=topic,
        language=language,
        resource_type=resource_type,
        url=url,
        content=content,
        author_id=user_id,
        author_name=author_name,
        tags=tags,
    )

    result = mongo.db.resources.insert_one(doc)
    doc["_id"] = result.inserted_id
    return to_public_resource(doc, current_user_id=user_id), None, 201


def get_resources(
    query: str = "",
    subject: str = "",
    language: str = "",
    resource_type: str = "",
    sort_by: str = "popular",
    page: int = 1,
    per_page: int = 12,
    current_user_id: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Search and paginate study resources with subject, language, and popularity sorting.
    """
    mongo_filter: Dict[str, Any] = {"is_active": True}

    if subject and subject.strip():
        mongo_filter["subject"] = {"$regex": subject.strip(), "$options": "i"}

    if language and language.strip():
        mongo_filter["language"] = {"$regex": language.strip(), "$options": "i"}

    if resource_type and resource_type.strip():
        mongo_filter["resource_type"] = resource_type.strip().upper()

    if query and query.strip():
        q = query.strip()
        mongo_filter["$or"] = [
            {"title": {"$regex": q, "$options": "i"}},
            {"description": {"$regex": q, "$options": "i"}},
            {"tags": {"$regex": q, "$options": "i"}},
        ]

    total = mongo.db.resources.count_documents(mongo_filter)
    page = max(1, int(page))
    per_page = max(1, min(50, int(per_page)))
    skip = (page - 1) * per_page

    # Sort order
    sort_field = [("upvotes", -1), ("created_at", -1)] if sort_by == "popular" else [("created_at", -1)]

    cursor = mongo.db.resources.find(mongo_filter).sort(sort_field).skip(skip).limit(per_page)
    resources = [to_public_resource(doc, current_user_id=current_user_id) for doc in cursor]

    total_pages = math.ceil(total / per_page) if per_page > 0 else 1

    return {
        "resources": resources,
        "total": total,
        "page": page,
        "per_page": per_page,
        "total_pages": max(1, total_pages),
    }


def toggle_upvote(user_id: str, resource_id: str) -> Tuple[Optional[Dict], Optional[str], int]:
    """
    Toggle helpful upvote on a community study resource.
    Prevents duplicate votes by storing user_id in upvoted_by array.
    """
    try:
        r_oid = ObjectId(resource_id)
    except Exception:
        return None, "Invalid resource ID format.", 400

    resource = mongo.db.resources.find_one({"_id": r_oid, "is_active": True})
    if not resource:
        return None, "Resource not found.", 404

    upvoted_by = [str(uid) for uid in resource.get("upvoted_by", [])]
    u_str = str(user_id)

    if u_str in upvoted_by:
        # Remove upvote
        mongo.db.resources.update_one(
            {"_id": r_oid},
            {
                "$pull": {"upvoted_by": u_str},
                "$inc": {"upvotes": -1},
                "$set": {"updated_at": datetime.now(timezone.utc)},
            },
        )
        has_upvoted = False
    else:
        # Add upvote
        mongo.db.resources.update_one(
            {"_id": r_oid},
            {
                "$addToSet": {"upvoted_by": u_str},
                "$inc": {"upvotes": 1},
                "$set": {"updated_at": datetime.now(timezone.utc)},
            },
        )
        has_upvoted = True

    updated_doc = mongo.db.resources.find_one({"_id": r_oid})
    serialized = to_public_resource(updated_doc, current_user_id=user_id)
    return serialized, None, 200


def delete_resource(user_id: str, resource_id: str) -> Tuple[bool, Optional[str], int]:
    """
    Author deletes their own community study resource.
    """
    try:
        r_oid = ObjectId(resource_id)
    except Exception:
        return False, "Invalid resource ID format.", 400

    resource = mongo.db.resources.find_one({"_id": r_oid})
    if not resource:
        return False, "Resource not found.", 404

    if str(resource.get("author_id", "")) != str(user_id):
        return False, "You are not authorized to delete this resource.", 403

    mongo.db.resources.delete_one({"_id": r_oid})
    return True, None, 200
