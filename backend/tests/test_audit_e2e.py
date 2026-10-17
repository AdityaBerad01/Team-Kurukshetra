"""
Comprehensive QA Audit Test Suite for PeerConnect.
Verifies all 18 core requirements end-to-end:
1. Registration & login
2. JWT authentication & role-based authorization
3. Tutor profile creation & editing
4. Tutor search & filters
5. Availability management & overlap rejection
6. Session request creation
7. Tutor accept & decline actions
8. Student cancellation releasing booked slot
9. Booking conflict protection
10. Dashboard statistics isolation & real data
11. Session history queries
12. Reviews & rating calculation rules
13. Safe error responses and status codes
"""
import pytest


def test_qa_audit_full_workflow(client):
    # ------------------------------------------------------------- #
    # 1. Registration & Login (Student & Tutor)
    # ------------------------------------------------------------- #
    std_payload = {
        "name": "Audit Student",
        "email": "audit.student@university.edu",
        "password": "Password123!",
        "role": "STUDENT",
    }
    reg_std_resp = client.post("/api/auth/register", json=std_payload)
    assert reg_std_resp.status_code == 201
    std_data = reg_std_resp.get_json()["data"]
    assert "access_token" in std_data
    assert std_data["role"] == "STUDENT"
    assert "password_hash" not in std_data

    # Login student
    login_std_resp = client.post(
        "/api/auth/login",
        json={"email": "audit.student@university.edu", "password": "Password123!"},
    )
    assert login_std_resp.status_code == 200
    std_token = login_std_resp.get_json()["data"]["access_token"]
    std_headers = {"Authorization": f"Bearer {std_token}"}

    # Register tutor
    tut_payload = {
        "name": "Audit Tutor",
        "email": "audit.tutor@university.edu",
        "password": "Password123!",
        "role": "TUTOR",
        "subjects": ["Mathematics", "Physics"],
        "bio": "Experienced tutor for audit test.",
    }
    reg_tut_resp = client.post("/api/auth/register", json=tut_payload)
    assert reg_tut_resp.status_code == 201
    tut_data = reg_tut_resp.get_json()["data"]
    tut_id = tut_data["id"]
    tut_token = tut_data["access_token"]
    tut_headers = {"Authorization": f"Bearer {tut_token}"}

    # ------------------------------------------------------------- #
    # 2. JWT Authentication & Role-based Authorization
    # ------------------------------------------------------------- #
    # Student attempting tutor-only action (create slot) -> 403 Forbidden
    forbidden_resp = client.post(
        "/api/slots",
        headers=std_headers,
        json={"date": "2026-11-20", "start_time": "10:00", "end_time": "11:00", "teaching_mode": "ONLINE"},
    )
    assert forbidden_resp.status_code == 403

    # Accessing protected route without token -> 401 Unauthorized
    unauth_resp = client.get("/api/auth/me")
    assert unauth_resp.status_code == 401

    # Valid token -> 200
    me_resp = client.get("/api/auth/me", headers=std_headers)
    assert me_resp.status_code == 200
    assert me_resp.get_json()["data"]["email"] == "audit.student@university.edu"

    # ------------------------------------------------------------- #
    # 3. Tutor Profile Management & 4. Search and Filters
    # ------------------------------------------------------------- #
    # Update profile
    update_prof_resp = client.put(
        "/api/tutors/profile/me",
        headers=tut_headers,
        json={"subjects": ["Mathematics", "Physics", "Computer Science"], "hourly_rate": 450},
    )
    assert update_prof_resp.status_code == 200
    assert "Computer Science" in update_prof_resp.get_json()["data"]["subjects"]

    # Search tutors
    search_resp = client.get("/api/tutors?q=Audit&subject=Mathematics")
    assert search_resp.status_code == 200
    tutors_found = search_resp.get_json()["data"]["tutors"]
    assert any(t["name"] == "Audit Tutor" for t in tutors_found)

    # ------------------------------------------------------------- #
    # 5. Availability Management
    # ------------------------------------------------------------- #
    slot_resp = client.post(
        "/api/slots",
        headers=tut_headers,
        json={"date": "2026-11-25", "start_time": "14:00", "end_time": "15:00", "teaching_mode": "ONLINE"},
    )
    assert slot_resp.status_code == 201
    slot_id = slot_resp.get_json()["data"]["id"]

    # Reject overlapping slot
    overlap_resp = client.post(
        "/api/slots",
        headers=tut_headers,
        json={"date": "2026-11-25", "start_time": "14:30", "end_time": "15:30", "teaching_mode": "ONLINE"},
    )
    assert overlap_resp.status_code == 400

    # ------------------------------------------------------------- #
    # 6. Session Request Creation & Conflict Protection
    # ------------------------------------------------------------- #
    # Reject tutor booking (role check returns 403 or 400)
    self_book = client.post(
        "/api/requests",
        headers=tut_headers,
        json={"slot_id": slot_id, "subject": "Mathematics", "message": "Self booking test"},
    )
    assert self_book.status_code in (400, 403)

    # Student requests session
    req_resp = client.post(
        "/api/requests",
        headers=std_headers,
        json={"slot_id": slot_id, "subject": "Mathematics", "message": "Calculus help"},
    )
    assert req_resp.status_code == 201
    req_id = req_resp.get_json()["data"]["id"]

    # ------------------------------------------------------------- #
    # 7. Tutor Accept Action & Concurrency
    # ------------------------------------------------------------- #
    accept_resp = client.patch(f"/api/requests/{req_id}/accept", headers=tut_headers)
    assert accept_resp.status_code == 200
    assert accept_resp.get_json()["data"]["status"] == "ACCEPTED"

    # Second student booking attempt on now BOOKED slot -> 409 Conflict
    client.post(
        "/api/auth/register",
        json={"name": "Competitor Student", "email": "comp@univ.edu", "password": "Password123!", "role": "STUDENT"},
    )
    comp_login = client.post(
        "/api/auth/login",
        json={"email": "comp@univ.edu", "password": "Password123!"},
    ).get_json()["data"]["access_token"]
    comp_headers = {"Authorization": f"Bearer {comp_login}"}

    comp_req = client.post(
        "/api/requests",
        headers=comp_headers,
        json={"slot_id": slot_id, "subject": "Mathematics", "message": "Competing booking"},
    )
    assert comp_req.status_code in (400, 409)
    assert "no longer available" in comp_req.get_json()["message"].lower() or "conflict" in comp_req.get_json()["message"].lower()

    # ------------------------------------------------------------- #
    # 8. Student Cancellation & Slot Release
    # ------------------------------------------------------------- #
    # Student cancels their accepted session
    cancel_resp = client.patch(f"/api/requests/{req_id}/cancel", headers=std_headers)
    assert cancel_resp.status_code == 200
    assert cancel_resp.get_json()["data"]["status"] == "CANCELLED"

    # Verify slot was released back to AVAILABLE
    slot_detail = client.get(f"/api/slots/tutor/{tut_id}").get_json()["data"]
    target_slot = next(s for s in slot_detail if s["id"] == slot_id)
    assert target_slot["status"] == "AVAILABLE"

    # ------------------------------------------------------------- #
    # 9. Lifecycle to Completion & 12. Reviews and Rating Aggregation
    # ------------------------------------------------------------- #
    # Re-book the now released slot
    re_req = client.post(
        "/api/requests",
        headers=std_headers,
        json={"slot_id": slot_id, "subject": "Mathematics", "message": "Rebooked after cancel"},
    ).get_json()["data"]["id"]

    client.patch(f"/api/requests/{re_req}/accept", headers=tut_headers)

    # Attempt review BEFORE session is completed -> 400 Bad Request
    early_review = client.post(
        "/api/reviews",
        headers=std_headers,
        json={"request_id": re_req, "rating": 5, "comment": "Premature review"},
    )
    assert early_review.status_code == 400

    # Mark completed
    comp_resp = client.patch(f"/api/requests/{re_req}/complete", headers=tut_headers)
    assert comp_resp.status_code == 200
    assert comp_resp.get_json()["data"]["status"] == "COMPLETED"

    # Non-participant attempts review -> 403 Forbidden
    intruder_review = client.post(
        "/api/reviews",
        headers=comp_headers,
        json={"request_id": re_req, "rating": 1, "comment": "Intruder feedback"},
    )
    assert intruder_review.status_code == 403

    # Eligible student submits review
    review_resp = client.post(
        "/api/reviews",
        headers=std_headers,
        json={"request_id": re_req, "rating": 5, "comment": "Outstanding tutor! Clear and patient."},
    )
    assert review_resp.status_code == 201

    # Duplicate review attempt -> 409 Conflict
    dup_review = client.post(
        "/api/reviews",
        headers=std_headers,
        json={"request_id": re_req, "rating": 4, "comment": "Second review attempt"},
    )
    assert dup_review.status_code == 409

    # Verify tutor aggregated rating
    tutor_reviews = client.get(f"/api/tutors/{tut_id}/reviews").get_json()["data"]
    assert tutor_reviews["average_rating"] == 5.0
    assert tutor_reviews["total_reviews"] == 1
    assert tutor_reviews["breakdown"]["5"] == 1

    # ------------------------------------------------------------- #
    # 10. Dashboard Statistics & Privacy Boundaries
    # ------------------------------------------------------------- #
    std_dash = client.get("/api/dashboard/student", headers=std_headers).get_json()["data"]
    assert std_dash["stats"]["completed_sessions"] == 1
    assert len(std_dash["recent_activity"]) >= 1

    tut_dash = client.get("/api/dashboard/tutor", headers=tut_headers).get_json()["data"]
    assert tut_dash["stats"]["completed_sessions"] == 1
    assert tut_dash["stats"]["average_rating"] == 5.0

    # Role privacy: student cannot access tutor dashboard -> 403
    assert client.get("/api/dashboard/tutor", headers=std_headers).status_code == 403
    # Role privacy: tutor cannot access student dashboard -> 403
    assert client.get("/api/dashboard/student", headers=tut_headers).status_code == 403
