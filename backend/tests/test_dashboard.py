"""
Automated tests for PeerConnect Dashboard metrics and session history.
Tests student dashboard, tutor dashboard, statistics computation from real data,
role authorization, and cross-user privacy enforcement.
"""
import pytest


def test_student_dashboard_metrics(client, tutor_token, student_token):
    """Student dashboard returns real computed statistics and recent activity."""
    t_token, tutor_user = tutor_token
    s_token, student_user = student_token

    # Setup profile and slot
    client.post(
        "/api/tutors/profile",
        headers={"Authorization": f"Bearer {t_token}"},
        json={
            "subjects": ["History", "Literature"],
            "introduction": "Humanities mentor",
            "department": "Arts",
            "year_of_study": 4,
            "teaching_modes": ["ONLINE"],
        },
    )

    slot_resp = client.post(
        "/api/slots",
        headers={"Authorization": f"Bearer {t_token}"},
        json={"date": "2026-11-25", "start_time": "15:00", "end_time": "16:00", "teaching_mode": "ONLINE"},
    )
    slot_id = slot_resp.get_json()["data"]["id"]

    # Student requests slot
    req_resp = client.post(
        "/api/requests",
        headers={"Authorization": f"Bearer {s_token}"},
        json={"slot_id": slot_id, "subject": "History", "message": "Ancient Rome overview."},
    )
    assert req_resp.status_code == 201

    # Fetch student dashboard
    dash_resp = client.get(
        "/api/dashboard/student",
        headers={"Authorization": f"Bearer {s_token}"},
    )
    assert dash_resp.status_code == 200
    data = dash_resp.get_json()["data"]
    stats = data["stats"]

    assert stats["total_requests"] == 1
    assert stats["pending_requests"] == 1
    assert stats["upcoming_sessions"] == 0
    assert stats["completed_sessions"] == 0
    assert len(data["recent_activity"]) == 1
    assert data["recent_activity"][0]["subject"] == "History"


def test_tutor_dashboard_metrics(client, tutor_token, student_token):
    """Tutor dashboard returns real computed statistics, available slots, and rating."""
    t_token, tutor_user = tutor_token
    s_token, student_user = student_token

    # Setup profile
    client.post(
        "/api/tutors/profile",
        headers={"Authorization": f"Bearer {t_token}"},
        json={
            "subjects": ["Biology"],
            "introduction": "Biology mentor",
            "department": "Life Sciences",
            "year_of_study": 3,
            "teaching_modes": ["ONLINE"],
        },
    )

    # Tutor creates 2 slots
    s1 = client.post(
        "/api/slots",
        headers={"Authorization": f"Bearer {t_token}"},
        json={"date": "2026-11-26", "start_time": "09:00", "end_time": "10:00", "teaching_mode": "ONLINE"},
    )
    s2 = client.post(
        "/api/slots",
        headers={"Authorization": f"Bearer {t_token}"},
        json={"date": "2026-11-26", "start_time": "11:00", "end_time": "12:00", "teaching_mode": "ONLINE"},
    )
    slot1_id = s1.get_json()["data"]["id"]

    # Student requests slot1
    req = client.post(
        "/api/requests",
        headers={"Authorization": f"Bearer {s_token}"},
        json={"slot_id": slot1_id, "subject": "Biology", "message": "Cell biology questions."},
    )
    req_id = req.get_json()["data"]["id"]

    # Tutor accepts request
    client.patch(f"/api/requests/{req_id}/accept", headers={"Authorization": f"Bearer {t_token}"})

    # Fetch tutor dashboard
    dash_resp = client.get(
        "/api/dashboard/tutor",
        headers={"Authorization": f"Bearer {t_token}"},
    )
    assert dash_resp.status_code == 200
    data = dash_resp.get_json()["data"]
    stats = data["stats"]

    assert stats["accepted_sessions"] == 1
    assert stats["available_slots"] == 1  # 2 created, 1 accepted/booked
    assert stats["completed_sessions"] == 0
    assert stats["average_rating"] == 0.0
    assert len(data["recent_activity"]) == 1


def test_dashboard_role_authorization_and_privacy(client, tutor_token, student_token):
    """Students cannot access tutor dashboard and tutors cannot access student dashboard."""
    t_token, _ = tutor_token
    s_token, _ = student_token

    # Student tries accessing tutor dashboard
    resp1 = client.get("/api/dashboard/tutor", headers={"Authorization": f"Bearer {s_token}"})
    assert resp1.status_code == 403

    # Tutor tries accessing student dashboard
    resp2 = client.get("/api/dashboard/student", headers={"Authorization": f"Bearer {t_token}"})
    assert resp2.status_code == 403

    # Unauthenticated access
    assert client.get("/api/dashboard/student").status_code == 401
    assert client.get("/api/dashboard/tutor").status_code == 401
