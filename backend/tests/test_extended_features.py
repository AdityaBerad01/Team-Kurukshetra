"""
Tests for Extended Master Build Features:
- Smart Backup Tutor
- Community Notes & Resource Exchange
- Focus Rooms & Study Sprints
- Smart Session Planner & Confidence Tracker
- Campus Skill Map
- Proof-of-Skill Portfolio
"""
import pytest
from app import create_app, mongo


@pytest.fixture
def app():
    app = create_app({"TESTING": True, "MONGO_URI": "mongodb://127.0.0.1:27017/peerconnect_test"})
    with app.app_context():
        # Clear test collections
        mongo.db.users.delete_many({})
        mongo.db.tutor_profiles.delete_many({})
        mongo.db.availability.delete_many({})
        mongo.db.session_requests.delete_many({})
        mongo.db.reviews.delete_many({})
        mongo.db.resources.delete_many({})
        mongo.db.focus_rooms.delete_many({})
        mongo.db.focus_sprints.delete_many({})
        mongo.db.session_plans.delete_many({})
        mongo.db.portfolios.delete_many({})
        yield app
        # Cleanup
        mongo.db.users.delete_many({})
        mongo.db.tutor_profiles.delete_many({})
        mongo.db.availability.delete_many({})
        mongo.db.session_requests.delete_many({})
        mongo.db.reviews.delete_many({})
        mongo.db.resources.delete_many({})
        mongo.db.focus_rooms.delete_many({})
        mongo.db.focus_sprints.delete_many({})
        mongo.db.session_plans.delete_many({})
        mongo.db.portfolios.delete_many({})


@pytest.fixture
def client(app):
    return app.test_client()


def test_community_resource_lifecycle(client):
    """Test resource publishing, searching, upvoting toggle, and deletion."""
    # Register author
    r_user = client.post("/api/auth/register", json={
        "name": "Resource Author",
        "email": "author@college.edu",
        "password": "Password123!",
        "role": "STUDENT",
    })
    token = r_user.get_json()["data"]["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 1. Create Resource
    r_create = client.post("/api/resources", headers=headers, json={
        "title": "Calculus 1 Cheat Sheet",
        "description": "Comprehensive cheat sheet covering derivatives, limits, and integrals.",
        "subject": "Mathematics",
        "topic": "Calculus",
        "resource_type": "LINK",
        "url": "https://math.edu/calculus-cheatsheet.pdf",
        "tags": ["calculus", "derivatives"],
    })
    assert r_create.status_code == 201
    res_data = r_create.get_json()["data"]
    res_id = res_data["id"]
    assert res_data["upvotes"] == 0
    assert res_data["title"] == "Calculus 1 Cheat Sheet"

    # 2. Search Resources
    r_search = client.get("/api/resources?subject=Mathematics")
    assert r_search.status_code == 200
    search_data = r_search.get_json()["data"]
    assert len(search_data["resources"]) >= 1

    # 3. Upvote Toggle (First time: upvote = 1)
    r_upvote1 = client.post(f"/api/resources/{res_id}/upvote", headers=headers)
    assert r_upvote1.status_code == 200
    assert r_upvote1.get_json()["data"]["upvotes"] == 1
    assert r_upvote1.get_json()["data"]["has_upvoted"] is True

    # 4. Upvote Toggle again (Remove upvote: upvote = 0)
    r_upvote2 = client.post(f"/api/resources/{res_id}/upvote", headers=headers)
    assert r_upvote2.status_code == 200
    assert r_upvote2.get_json()["data"]["upvotes"] == 0
    assert r_upvote2.get_json()["data"]["has_upvoted"] is False

    # 5. Delete Resource
    r_del = client.delete(f"/api/resources/{res_id}", headers=headers)
    assert r_del.status_code == 200


def test_focus_rooms_and_sprints(client):
    """Test focus room creation, listing, joining, leaving, and logging completed sprints."""
    r_user = client.post("/api/auth/register", json={
        "name": "Sprint Host",
        "email": "host@college.edu",
        "password": "Password123!",
        "role": "STUDENT",
    })
    token = r_user.get_json()["data"]["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 1. Create Room
    r_room = client.post("/api/focus/rooms", headers=headers, json={
        "title": "Late Night Algorithms Sprint",
        "subject": "Computer Science",
        "goal": "Solve 3 dynamic programming problems",
        "duration_minutes": 25,
    })
    assert r_room.status_code == 201
    room_id = r_room.get_json()["data"]["id"]
    assert r_room.get_json()["data"]["participants_count"] == 1

    # 2. Get active rooms
    r_list = client.get("/api/focus/rooms")
    assert r_list.status_code == 200
    assert len(r_list.get_json()["data"]) >= 1

    # 3. Complete sprint
    r_sprint = client.post("/api/focus/complete-sprint", headers=headers, json={
        "room_id": room_id,
        "subject": "Computer Science",
        "duration_minutes": 25,
    })
    assert r_sprint.status_code == 201

    # 4. Check user stats
    r_stats = client.get("/api/focus/my-stats", headers=headers)
    assert r_stats.status_code == 200
    stats = r_stats.get_json()["data"]
    assert stats["total_sprints"] == 1
    assert stats["total_minutes"] == 25


def test_session_plan_and_confidence_tracker(client):
    """Test session plan creation, objective updates, and confidence ratings."""
    # Register student & tutor
    r_s = client.post("/api/auth/register", json={"name": "Plan Student", "email": "plan_s@college.edu", "password": "Password123!", "role": "STUDENT"})
    s_token = r_s.get_json()["data"]["access_token"]
    r_t = client.post("/api/auth/register", json={"name": "Plan Tutor", "email": "plan_t@college.edu", "password": "Password123!", "role": "TUTOR"})
    t_id = r_t.get_json()["data"]["id"]

    # Create slot & request
    slot = mongo.db.availability.insert_one({
        "tutor_id": t_id, "date": "2026-10-28", "start_time": "10:00", "end_time": "11:00", "status": "AVAILABLE",
    })
    s_headers = {"Authorization": f"Bearer {s_token}"}
    r_req = client.post("/api/requests", headers=s_headers, json={"slot_id": str(slot.inserted_id), "subject": "Physics"})
    req_id = r_req.get_json()["data"]["id"]

    # 1. Get/Create Plan
    r_plan = client.get(f"/api/requests/{req_id}/plan", headers=s_headers)
    assert r_plan.status_code == 200
    assert r_plan.get_json()["data"]["request_id"] == req_id

    # 2. Update Plan
    r_update_plan = client.put(f"/api/requests/{req_id}/plan", headers=s_headers, json={
        "objectives": "Understand Newton's Laws and Free Body Diagrams",
        "difficult_concepts": "Rotational friction",
    })
    assert r_update_plan.status_code == 200
    assert r_update_plan.get_json()["data"]["objectives"] == "Understand Newton's Laws and Free Body Diagrams"

    # 3. Record Confidence Ratings (pre and post)
    r_conf = client.post(f"/api/requests/{req_id}/confidence", headers=s_headers, json={
        "pre_confidence": 2,
        "post_confidence": 5,
        "confidence_notes": "Great session, cleared all friction confusion!",
    })
    assert r_conf.status_code == 200
    conf_data = r_conf.get_json()["data"]
    assert conf_data["pre_confidence"] == 2
    assert conf_data["post_confidence"] == 5

    # 4. Fetch Student Confidence Trends
    r_trends = client.get("/api/confidence/my-trends", headers=s_headers)
    assert r_trends.status_code == 200
    trends = r_trends.get_json()["data"]
    assert len(trends) >= 1
    assert trends[0]["delta"] == 3


def test_campus_skill_map_and_portfolio(client):
    """Test campus skill map demand/supply aggregation and proof-of-skill portfolio."""
    # Register user
    r_user = client.post("/api/auth/register", json={
        "name": "Portfolio Scholar",
        "email": "portfolio@college.edu",
        "password": "Password123!",
        "role": "STUDENT",
        "campus": "Tech Campus",
    })
    token = r_user.get_json()["data"]["access_token"]
    u_id = r_user.get_json()["data"]["id"]
    headers = {"Authorization": f"Bearer {token}"}

    # 1. Campus Skill Map
    r_map = client.get("/api/campus-skill-map?campus=Tech%20Campus")
    assert r_map.status_code == 200
    map_data = r_map.get_json()["data"]
    assert "subject_breakdown" in map_data
    assert "high_opportunity_subjects" in map_data

    # 2. Get/Create Portfolio
    r_port = client.get("/api/portfolio/me", headers=headers)
    assert r_port.status_code == 200
    port_data = r_port.get_json()["data"]
    assert port_data["user_name"] == "Portfolio Scholar"
    assert len(port_data["verified_achievements"]) >= 1

    # 3. Update Portfolio with Project
    r_port_update = client.put("/api/portfolio/me", headers=headers, json={
        "headline": "Junior AI Researcher & Peer Mentor",
        "skills": ["Python", "TensorFlow", "Algorithms"],
        "projects": [
            {
                "title": "PeerConnect Search Engine",
                "description": "Deterministic ranking algorithm for peer tutor matching.",
                "repo_url": "https://github.com/test/peerconnect",
                "skills": ["Python", "MongoDB"],
                "is_public": True,
            }
        ]
    })
    assert r_port_update.status_code == 200
    updated_port = r_port_update.get_json()["data"]
    assert updated_port["headline"] == "Junior AI Researcher & Peer Mentor"
    assert len(updated_port["projects"]) == 1

    # 4. Public Portfolio View
    r_public = client.get(f"/api/portfolio/{u_id}")
    assert r_public.status_code == 200
    assert r_public.get_json()["data"]["headline"] == "Junior AI Researcher & Peer Mentor"
