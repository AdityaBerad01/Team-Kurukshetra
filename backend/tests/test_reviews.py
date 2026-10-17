"""
Automated tests for PeerConnect reviews service and API.
Tests review eligibility, rating and comment validation, uniqueness per session,
rating aggregation, and authorization rules.
"""
import pytest


def _setup_completed_session(client, tutor_token, student_token):
    """Helper to set up a tutor profile, slot, booking, acceptance, and completion."""
    t_token, tutor_user = tutor_token
    s_token, student_user = student_token

    # 1. Create tutor profile
    client.post(
        "/api/tutors/profile",
        headers={"Authorization": f"Bearer {t_token}"},
        json={
            "subjects": ["Mathematics", "Physics"],
            "introduction": "Experienced peer mentor",
            "department": "Engineering",
            "year_of_study": 3,
            "teaching_modes": ["ONLINE"],
            "hourly_rate": 25,
        },
    )

    # 2. Tutor creates slot
    slot_resp = client.post(
        "/api/slots",
        headers={"Authorization": f"Bearer {t_token}"},
        json={
            "date": "2026-11-20",
            "start_time": "14:00",
            "end_time": "15:00",
            "teaching_mode": "ONLINE",
        },
    )
    assert slot_resp.status_code == 201
    slot_id = slot_resp.get_json()["data"]["id"]

    # 3. Student requests slot
    req_resp = client.post(
        "/api/requests",
        headers={"Authorization": f"Bearer {s_token}"},
        json={"slot_id": slot_id, "subject": "Mathematics", "message": "Need help with Linear Algebra."},
    )
    assert req_resp.status_code == 201
    request_id = req_resp.get_json()["data"]["id"]

    # 4. Tutor accepts request
    acc_resp = client.patch(
        f"/api/requests/{request_id}/accept",
        headers={"Authorization": f"Bearer {t_token}"},
    )
    assert acc_resp.status_code == 200

    # 5. Complete session
    comp_resp = client.patch(
        f"/api/requests/{request_id}/complete",
        headers={"Authorization": f"Bearer {t_token}"},
    )
    assert comp_resp.status_code == 200

    return request_id, tutor_user["id"], student_user["id"]


def test_submit_review_success(client, tutor_token, student_token):
    """Student submits a review for an eligible completed session."""
    s_token, _ = student_token
    request_id, tutor_id, _ = _setup_completed_session(client, tutor_token, student_token)

    resp = client.post(
        "/api/reviews",
        headers={"Authorization": f"Bearer {s_token}"},
        json={
            "request_id": request_id,
            "rating": 5,
            "comment": "Outstanding session! Dr. Raman explained eigenvalues with amazing clarity.",
        },
    )
    assert resp.status_code == 201
    data = resp.get_json()["data"]
    assert data["rating"] == 5
    assert "eigenvalues" in data["comment"]
    assert data["tutor_id"] == tutor_id
    assert data["student_name"] == "Aarav Gupta"


def test_reject_review_for_non_completed_session(client, tutor_token, student_token):
    """Review must be rejected if the session is not COMPLETED."""
    t_token, _ = tutor_token
    s_token, _ = student_token

    client.post(
        "/api/tutors/profile",
        headers={"Authorization": f"Bearer {t_token}"},
        json={
            "subjects": ["Chemistry"],
            "introduction": "Chemistry mentor",
            "department": "Science",
            "year_of_study": 2,
            "teaching_modes": ["ONLINE"],
        },
    )

    slot_resp = client.post(
        "/api/slots",
        headers={"Authorization": f"Bearer {t_token}"},
        json={"date": "2026-11-21", "start_time": "10:00", "end_time": "11:00", "teaching_mode": "ONLINE"},
    )
    slot_id = slot_resp.get_json()["data"]["id"]

    req_resp = client.post(
        "/api/requests",
        headers={"Authorization": f"Bearer {s_token}"},
        json={"slot_id": slot_id, "subject": "Chemistry", "message": "Organic chemistry help."},
    )
    request_id = req_resp.get_json()["data"]["id"]

    # Still PENDING
    resp = client.post(
        "/api/reviews",
        headers={"Authorization": f"Bearer {s_token}"},
        json={"request_id": request_id, "rating": 5, "comment": "Premature review."},
    )
    assert resp.status_code == 400
    assert "completed" in resp.get_json()["message"].lower()


def test_reject_unauthorized_student_review(client, tutor_token, student_token):
    """An unrelated student or tutor cannot review a session."""
    t_token, _ = tutor_token
    request_id, _, _ = _setup_completed_session(client, tutor_token, student_token)

    # 1. Tutor attempts to review
    tutor_rev = client.post(
        "/api/reviews",
        headers={"Authorization": f"Bearer {t_token}"},
        json={"request_id": request_id, "rating": 5, "comment": "Tutor reviewing self."},
    )
    assert tutor_rev.status_code == 403

    # 2. Another student attempts to review
    client.post(
        "/api/auth/register",
        json={"name": "Sneha Patil", "email": "sneha@student.edu", "password": "Password123!", "role": "STUDENT"},
    )
    login_other = client.post(
        "/api/auth/login",
        json={"email": "sneha@student.edu", "password": "Password123!"},
    )
    other_token = login_other.get_json()["data"]["access_token"]

    other_rev = client.post(
        "/api/reviews",
        headers={"Authorization": f"Bearer {other_token}"},
        json={"request_id": request_id, "rating": 5, "comment": "I was not in this session."},
    )
    assert other_rev.status_code == 403


def test_reject_duplicate_review(client, tutor_token, student_token):
    """Allow at most one review per session request."""
    s_token, _ = student_token
    request_id, _, _ = _setup_completed_session(client, tutor_token, student_token)

    # First review
    first_resp = client.post(
        "/api/reviews",
        headers={"Authorization": f"Bearer {s_token}"},
        json={"request_id": request_id, "rating": 4, "comment": "Very helpful explanation."},
    )
    assert first_resp.status_code == 201

    # Second duplicate review
    second_resp = client.post(
        "/api/reviews",
        headers={"Authorization": f"Bearer {s_token}"},
        json={"request_id": request_id, "rating": 5, "comment": "Trying to review again."},
    )
    assert second_resp.status_code == 409
    assert "already" in second_resp.get_json()["message"].lower()


def test_validate_rating_and_comment(client, tutor_token, student_token):
    """Reject invalid ratings (outside 1..5) or empty/short comments."""
    s_token, _ = student_token
    request_id, _, _ = _setup_completed_session(client, tutor_token, student_token)

    # Rating = 0
    r0 = client.post(
        "/api/reviews",
        headers={"Authorization": f"Bearer {s_token}"},
        json={"request_id": request_id, "rating": 0, "comment": "Good"},
    )
    assert r0.status_code == 400

    # Rating = 6
    r6 = client.post(
        "/api/reviews",
        headers={"Authorization": f"Bearer {s_token}"},
        json={"request_id": request_id, "rating": 6, "comment": "Great"},
    )
    assert r6.status_code == 400

    # Comment too short
    r_short = client.post(
        "/api/reviews",
        headers={"Authorization": f"Bearer {s_token}"},
        json={"request_id": request_id, "rating": 5, "comment": "Ok"},
    )
    assert r_short.status_code == 400


def test_get_tutor_reviews_aggregates_rating(client, tutor_token, student_token):
    """Fetch tutor reviews and verify rating calculations from stored records."""
    s_token, _ = student_token
    request_id, tutor_id, _ = _setup_completed_session(client, tutor_token, student_token)

    # Submit 5-star review
    client.post(
        "/api/reviews",
        headers={"Authorization": f"Bearer {s_token}"},
        json={"request_id": request_id, "rating": 5, "comment": "Flawless lesson."},
    )

    # Public endpoint
    resp = client.get(f"/api/tutors/{tutor_id}/reviews")
    assert resp.status_code == 200
    data = resp.get_json()["data"]
    assert data["total_reviews"] == 1
    assert data["average_rating"] == 5.0
    assert data["breakdown"]["5"] == 1
    assert len(data["reviews"]) == 1
    assert data["reviews"][0]["comment"] == "Flawless lesson."
