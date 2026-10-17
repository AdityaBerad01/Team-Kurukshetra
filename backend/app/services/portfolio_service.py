"""
Portfolio Service for PeerConnect Proof-of-Skill.
Computes platform-verified badges from real MongoDB session records & quizzes.
"""
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional, Tuple
from bson import ObjectId

from app import mongo
from app.models.portfolio import new_portfolio, to_public_portfolio


def _compute_verified_achievements(user_id: str) -> List[Dict[str, Any]]:
    """
    Generate platform-verified achievements from authoritative database records.
    Never fabricates badges; strictly reflects actual completed sessions and assessments.
    """
    achievements: List[Dict[str, Any]] = []
    u_str = str(user_id)

    # 1. Sessions completed as Tutor
    tutor_completed = mongo.db.session_requests.count_documents({
        "tutor_id": u_str,
        "status": "COMPLETED",
    })
    if tutor_completed >= 5:
        achievements.append({
            "title": f"Senior Academic Mentor ({tutor_completed}+ Sessions)",
            "badge": "🎖️",
            "type": "TUTORING_HOURS",
            "description": f"Verified delivery of {tutor_completed} complete tutoring appointments.",
        })
    elif tutor_completed >= 1:
        achievements.append({
            "title": f"Verified Peer Mentor ({tutor_completed} Session{'s' if tutor_completed > 1 else ''})",
            "badge": "⭐",
            "type": "TUTORING_HOURS",
            "description": f"Successfully completed {tutor_completed} verified peer tutoring session.",
        })

    # 2. Sessions completed as Student
    student_completed = mongo.db.session_requests.count_documents({
        "student_id": u_str,
        "status": "COMPLETED",
    })
    if student_completed >= 1:
        achievements.append({
            "title": f"Active Academic Learner ({student_completed} Sessions)",
            "badge": "🎓",
            "type": "LEARNING_ENGAGEMENT",
            "description": f"Attended and completed {student_completed} peer study sessions.",
        })

    # 3. Diagnostic Assessment Mastery
    high_quizzes = list(mongo.db.assessments.find({
        "student_id": u_str,
        "status": "SUBMITTED",
        "score": {"$gte": 80},
    }))
    quiz_subjects_seen = set()
    for q in high_quizzes:
        sub = q.get("subject", "Academic")
        quiz_subjects_seen.add(sub)
        score = q.get("score", 100)
        achievements.append({
            "title": f"{sub} Diagnostic Mastery ({score}%)",
            "badge": "🏆",
            "type": "ASSESSMENT_EXCELLENCE",
            "description": f"Scored {score}% on verified peer-evaluated {sub} assessment.",
        })

    # Also check assessment submissions from diagnostic tests
    try:
        high_subs = list(mongo.db.assessment_submissions.find({
            "student_id": u_str,
            "score": {"$gte": 80},
        }))
        for hs in high_subs:
            aid = hs.get("assessment_id")
            score = hs.get("score", 100)
            a_doc = None
            try:
                a_doc = mongo.db.assessments.find_one({"_id": ObjectId(aid)})
            except Exception:
                pass
            sub = a_doc.get("subject", "Academic") if a_doc else "Academic"
            if sub not in quiz_subjects_seen:
                quiz_subjects_seen.add(sub)
                achievements.append({
                    "title": f"{sub} Diagnostic Mastery ({score}%)",
                    "badge": "🏆",
                    "type": "ASSESSMENT_EXCELLENCE",
                    "description": f"Scored {score}% on verified peer diagnostic {sub} assessment.",
                })
    except Exception:
        pass

    # 4. Perfect 5-Star Reviews
    reviews_count = mongo.db.reviews.count_documents({"tutor_id": u_str, "rating": 5})
    if reviews_count >= 1:
        achievements.append({
            "title": f"5-Star Rated Educator ({reviews_count} Perfect Review{'s' if reviews_count > 1 else ''})",
            "badge": "🌟",
            "type": "STUDENT_SATISFACTION",
            "description": "Consistently rated 5 out of 5 stars by peer students.",
        })

    # If new user, baseline welcome achievement
    if not achievements:
        achievements.append({
            "title": "Welcome Peer Scholar",
            "badge": "🌱",
            "type": "MEMBER",
            "description": "Active registered scholar on the PeerConnect academic network.",
        })

    return achievements


def get_or_create_portfolio(user_id: str) -> Tuple[Optional[Dict], Optional[str], int]:
    """
    Retrieve or initialize the authenticated user's portfolio.
    """
    u_str = str(user_id)
    doc = mongo.db.portfolios.find_one({"user_id": u_str})
    if not doc:
        doc = new_portfolio(u_str)
        res = mongo.db.portfolios.insert_one(doc)
        doc["_id"] = res.inserted_id

    user_doc = None
    try:
        user_doc = mongo.db.users.find_one({"_id": ObjectId(user_id)})
    except Exception:
        pass

    achievements = _compute_verified_achievements(u_str)
    return to_public_portfolio(doc, user_doc=user_doc, verified_achievements=achievements), None, 200


def update_portfolio(user_id: str, data: Dict[str, Any]) -> Tuple[Optional[Dict], Optional[str], int]:
    """
    Update self-reported projects, skills, headline, and visibility.
    """
    u_str = str(user_id)
    update_fields: Dict[str, Any] = {"updated_at": datetime.now(timezone.utc)}

    if "headline" in data:
        update_fields["headline"] = str(data["headline"]).strip()
    if "bio_summary" in data:
        update_fields["bio_summary"] = str(data["bio_summary"]).strip()
    if "is_public" in data:
        update_fields["is_public"] = bool(data["is_public"])
    if "skills" in data and isinstance(data["skills"], list):
        update_fields["skills"] = [str(s).strip() for s in data["skills"] if str(s).strip()]
    if "projects" in data and isinstance(data["projects"], list):
        cleaned_projects = []
        for p in data["projects"]:
            if isinstance(p, dict) and p.get("title"):
                cleaned_projects.append({
                    "id": p.get("id") or str(ObjectId()),
                    "title": str(p["title"]).strip(),
                    "description": str(p.get("description", "")).strip(),
                    "repo_url": str(p.get("repo_url", "")).strip(),
                    "demo_url": str(p.get("demo_url", "")).strip(),
                    "skills": [str(s).strip() for s in p.get("skills", []) if str(s).strip()],
                    "is_public": bool(p.get("is_public", True)),
                })
        update_fields["projects"] = cleaned_projects

    mongo.db.portfolios.update_one(
        {"user_id": u_str},
        {"$set": update_fields},
        upsert=True,
    )

    return get_or_create_portfolio(user_id)


def get_public_portfolio(user_id: str) -> Tuple[Optional[Dict], Optional[str], int]:
    """
    Publicly view a scholar's portfolio if marked as public.
    Accepts either user_id or tutor_profile id for seamless navigation.
    """
    u_str = str(user_id).strip()

    # If an ObjectId belongs to a tutor_profile, resolve its user_id
    try:
        tutor_prof = mongo.db.tutor_profiles.find_one({"_id": ObjectId(u_str)})
        if tutor_prof and tutor_prof.get("user_id"):
            u_str = str(tutor_prof["user_id"])
    except Exception:
        pass

    user_doc = None
    try:
        user_doc = mongo.db.users.find_one({"_id": ObjectId(u_str)})
    except Exception:
        pass

    doc = mongo.db.portfolios.find_one({"user_id": u_str})
    if not doc:
        if not user_doc:
            return None, "Portfolio not found.", 404
        # User exists, initialize default public portfolio
        doc = new_portfolio(u_str)
        res = mongo.db.portfolios.insert_one(doc)
        doc["_id"] = res.inserted_id

    if not doc.get("is_public", True):
        return None, "This scholar's portfolio is set to private.", 403

    achievements = _compute_verified_achievements(u_str)
    return to_public_portfolio(doc, user_doc=user_doc, verified_achievements=achievements), None, 200
