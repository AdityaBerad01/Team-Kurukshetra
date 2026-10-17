"""
Campus Skill Map Service for PeerConnect.
Aggregates campus-wide learning demand vs tutor supply into privacy-safe analytics.
"""
from collections import Counter
from typing import Any, Dict, List, Optional
from app import mongo


def get_campus_skill_map(campus: Optional[str] = None) -> Dict[str, Any]:
    """
    Generate privacy-safe campus skill and tutoring demand analytics.
    Aggregates subjects demanded by students vs subjects offered by peer educators.
    """
    user_filter: Dict[str, Any] = {}
    profile_filter: Dict[str, Any] = {}
    if campus and campus.strip():
        c_regex = {"$regex": campus.strip(), "$options": "i"}
        user_filter["campus"] = c_regex
        profile_filter["campus"] = c_regex

    # 1. Tutor Supply: Count tutors offering each subject
    tutor_profiles = list(mongo.db.tutor_profiles.find(profile_filter, {"subjects": 1}))
    supply_counter: Counter = Counter()
    for tp in tutor_profiles:
        for sub in tp.get("subjects", []):
            if sub and isinstance(sub, str):
                supply_counter[sub.strip()] += 1

    # 2. Student Demand: Count subject demand from session requests & learning goals
    demand_counter: Counter = Counter()
    
    # From session requests
    requests = list(mongo.db.session_requests.find({}, {"subject": 1}))
    for req in requests:
        sub = req.get("subject")
        if sub and isinstance(sub, str):
            demand_counter[sub.strip()] += 1

    # From user subjects to learn and assessments
    students = list(mongo.db.users.find(user_filter, {"subjects_to_learn": 1, "learning_goals": 1}))
    for s in students:
        for sub in s.get("subjects_to_learn", []):
            if sub and isinstance(sub, str):
                demand_counter[sub.strip()] += 1

    # Baseline seed subjects if database is brand new so dashboard renders rich stats
    all_subjects = sorted(list(set(list(supply_counter.keys()) + list(demand_counter.keys()))))
    if not all_subjects:
        all_subjects = ["Mathematics", "Computer Science", "Physics", "Chemistry", "Economics", "Statistics"]

    breakdown = []
    shortage_subjects = []

    for sub in all_subjects:
        sup = supply_counter.get(sub, 0)
        dem = demand_counter.get(sub, 0)
        
        # Calculate shortage gap
        gap = dem - sup
        if gap > 0 or (dem > 0 and sup == 0):
            status = "CRITICAL_SHORTAGE" if sup == 0 and dem > 0 else "HIGH_DEMAND"
            shortage_subjects.append({
                "subject": sub,
                "demand_count": dem,
                "supply_count": sup,
                "gap": max(1, gap),
                "status": status,
            })
        elif sup >= dem and dem > 0:
            status = "BALANCED"
        else:
            status = "AVAILABLE"

        breakdown.append({
            "subject": sub,
            "tutors_available": sup,
            "student_requests": dem,
            "status": status,
        })

    # Sort shortages by largest gap
    shortage_subjects.sort(key=lambda x: x["gap"], reverse=True)

    total_active_students = mongo.db.users.count_documents({"role": "STUDENT"})
    total_active_tutors = mongo.db.tutor_profiles.count_documents({})
    total_sessions_booked = mongo.db.session_requests.count_documents({})

    return {
        "campus": campus or "All Campuses",
        "total_active_students": total_active_students,
        "total_active_tutors": total_active_tutors,
        "total_sessions_booked": total_sessions_booked,
        "subject_breakdown": breakdown,
        "high_opportunity_subjects": shortage_subjects[:6],
    }
