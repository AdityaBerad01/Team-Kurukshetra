"""
Tests for Tutor Availability and Session Booking Request Endpoints.
"""
from datetime import datetime, timedelta, timezone


def _future_date(days: int = 5) -> str:
    """Helper to return an ISO date string safely in the future."""
    return (datetime.now(timezone.utc) + timedelta(days=days)).strftime("%Y-%m-%d")


def _past_date(days: int = 5) -> str:
    """Helper to return an ISO date string in the past."""
    return (datetime.now(timezone.utc) - timedelta(days=days)).strftime("%Y-%m-%d")


# ── Availability Slot Tests ──────────────────────────────────────────────────

def test_create_and_delete_slot(client, tutor_token):
    token, _ = tutor_token
    date_str = _future_date(2)

    # 1. Create slot
    create_resp = client.post(
        "/api/slots",
        json={
            "date": date_str,
            "start_time": "10:00",
            "end_time": "11:00",
            "teaching_mode": "ONLINE",
        },
        headers={"Authorization": f"Bearer {token}"},
    )
    assert create_resp.status_code == 201
    slot = create_resp.get_json()["data"]
    assert slot["status"] == "AVAILABLE"
    assert slot["start_time"] == "10:00"
    assert slot["end_time"] == "11:00"
    slot_id = slot["id"]

    # 2. Get tutor slots
    get_resp = client.get(f"/api/slots/tutor/{slot['tutor_id']}")
    assert get_resp.status_code == 200
    slots = get_resp.get_json()["data"]
    assert len(slots) == 1
    assert slots[0]["id"] == slot_id

    # 3. Delete slot
    del_resp = client.delete(
        f"/api/slots/{slot_id}",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert del_resp.status_code == 200

    # Verify deleted
    after_resp = client.get(f"/api/slots/tutor/{slot['tutor_id']}")
    assert len(after_resp.get_json()["data"]) == 0


def test_reject_invalid_time_ranges(client, tutor_token):
    token, _ = tutor_token
    date_str = _future_date(3)

    # start_time equal to end_time
    resp1 = client.post(
        "/api/slots",
        json={"date": date_str, "start_time": "14:00", "end_time": "14:00"},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert resp1.status_code == 400
    assert "before end time" in resp1.get_json()["message"]

    # start_time after end_time
    resp2 = client.post(
        "/api/slots",
        json={"date": date_str, "start_time": "16:00", "end_time": "15:00"},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert resp2.status_code == 400

    # Past date
    resp3 = client.post(
        "/api/slots",
        json={"date": _past_date(1), "start_time": "10:00", "end_time": "11:00"},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert resp3.status_code == 400
    assert "past date" in resp3.get_json()["message"].lower()


def test_reject_overlapping_slots(client, tutor_token):
    token, _ = tutor_token
    date_str = _future_date(4)

    # Create initial slot: 10:00 - 12:00
    client.post(
        "/api/slots",
        json={"date": date_str, "start_time": "10:00", "end_time": "12:00"},
        headers={"Authorization": f"Bearer {token}"},
    )

    # 1. Exact overlap
    resp1 = client.post(
        "/api/slots",
        json={"date": date_str, "start_time": "10:00", "end_time": "12:00"},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert resp1.status_code == 400
    assert "overlaps" in resp1.get_json()["message"].lower()

    # 2. Inside overlap: 10:30 - 11:30
    resp2 = client.post(
        "/api/slots",
        json={"date": date_str, "start_time": "10:30", "end_time": "11:30"},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert resp2.status_code == 400

    # 3. Partial overlap left: 09:30 - 10:30
    resp3 = client.post(
        "/api/slots",
        json={"date": date_str, "start_time": "09:30", "end_time": "10:30"},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert resp3.status_code == 400

    # 4. Partial overlap right: 11:30 - 12:30
    resp4 = client.post(
        "/api/slots",
        json={"date": date_str, "start_time": "11:30", "end_time": "12:30"},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert resp4.status_code == 400

    # 5. Non-overlapping adjacent slots should be allowed: 12:00 - 13:00
    resp5 = client.post(
        "/api/slots",
        json={"date": date_str, "start_time": "12:00", "end_time": "13:00"},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert resp5.status_code == 201


def test_reject_unauthorized_slot_actions(client, tutor_token, student_token):
    t_token, tutor = tutor_token
    s_token, _ = student_token
    date_str = _future_date(5)

    # Student cannot create slot
    student_create = client.post(
        "/api/slots",
        json={"date": date_str, "start_time": "14:00", "end_time": "15:00"},
        headers={"Authorization": f"Bearer {s_token}"},
    )
    assert student_create.status_code == 403

    # Tutor creates slot
    tutor_create = client.post(
        "/api/slots",
        json={"date": date_str, "start_time": "14:00", "end_time": "15:00"},
        headers={"Authorization": f"Bearer {t_token}"},
    )
    slot_id = tutor_create.get_json()["data"]["id"]

    # Student cannot delete or update slot
    assert client.delete(f"/api/slots/{slot_id}", headers={"Authorization": f"Bearer {s_token}"}).status_code == 403
    assert client.put(f"/api/slots/{slot_id}", json={"start_time": "13:00"}, headers={"Authorization": f"Bearer {s_token}"}).status_code == 403


# ── Session Request Tests ────────────────────────────────────────────────────

def _setup_tutor_and_slot(client, tutor_token, date_str, start_time="10:00", end_time="11:00"):
    t_token, tutor = tutor_token
    # Set up tutor profile with subjects
    client.post(
        "/api/tutors/profile",
        json={
            "subjects": ["Mathematics", "Physics"],
            "introduction": "Teaching calculus & mechanics",
            "teaching_modes": ["ONLINE"],
        },
        headers={"Authorization": f"Bearer {t_token}"},
    )
    # Create slot
    slot_resp = client.post(
        "/api/slots",
        json={"date": date_str, "start_time": start_time, "end_time": end_time, "teaching_mode": "ONLINE"},
        headers={"Authorization": f"Bearer {t_token}"},
    )
    return slot_resp.get_json()["data"]["id"]


def test_submit_tutoring_request_success(client, tutor_token, student_token):
    t_token, _ = tutor_token
    s_token, student = student_token
    date_str = _future_date(6)

    slot_id = _setup_tutor_and_slot(client, tutor_token, date_str)

    # Student submits request
    req_resp = client.post(
        "/api/requests",
        json={
            "slot_id": slot_id,
            "subject": "Mathematics",
            "message": "Need help with multivariate integration.",
        },
        headers={"Authorization": f"Bearer {s_token}"},
    )
    assert req_resp.status_code == 201
    req = req_resp.get_json()["data"]
    assert req["status"] == "PENDING"
    assert req["subject"] == "Mathematics"
    assert req["studentName"] == "Aarav Gupta"


def test_reject_request_for_unoffered_subject(client, tutor_token, student_token):
    _, _ = tutor_token
    s_token, _ = student_token
    date_str = _future_date(7)

    slot_id = _setup_tutor_and_slot(client, tutor_token, date_str)

    # Subject not in Mathematics or Physics
    req_resp = client.post(
        "/api/requests",
        json={"slot_id": slot_id, "subject": "Macroeconomics"},
        headers={"Authorization": f"Bearer {s_token}"},
    )
    assert req_resp.status_code == 400
    assert "does not offer" in req_resp.get_json()["message"].lower()


def test_reject_self_booking(client, tutor_token):
    t_token, _ = tutor_token
    date_str = _future_date(8)
    slot_id = _setup_tutor_and_slot(client, tutor_token, date_str)

    # Tutor attempting to book their own slot
    req_resp = client.post(
        "/api/requests",
        json={"slot_id": slot_id, "subject": "Mathematics"},
        headers={"Authorization": f"Bearer {t_token}"},
    )
    # Rejects either because role is TUTOR (only students can book) or self-booking
    assert req_resp.status_code in (400, 403)


def test_accept_and_decline_requests(client, tutor_token, student_token):
    t_token, tutor = tutor_token
    s_token, _ = student_token
    date_str = _future_date(9)

    slot_id = _setup_tutor_and_slot(client, tutor_token, date_str)

    # Student creates request
    req_id = client.post(
        "/api/requests",
        json={"slot_id": slot_id, "subject": "Mathematics", "message": "Prep for midterm"},
        headers={"Authorization": f"Bearer {s_token}"},
    ).get_json()["data"]["id"]

    # Student cannot accept request
    assert client.patch(f"/api/requests/{req_id}/accept", headers={"Authorization": f"Bearer {s_token}"}).status_code == 403

    # Tutor accepts request
    accept_resp = client.patch(f"/api/requests/{req_id}/accept", headers={"Authorization": f"Bearer {t_token}"})
    assert accept_resp.status_code == 200
    assert accept_resp.get_json()["data"]["status"] == "ACCEPTED"

    # Verify slot is now BOOKED
    slots_resp = client.get(f"/api/slots/tutor/{tutor['id']}")
    assert slots_resp.get_json()["data"][0]["status"] == "BOOKED"


def test_concurrency_competing_booking_cannot_double_book(client, tutor_token, student_token):
    t_token, tutor = tutor_token
    s1_token, _ = student_token
    date_str = _future_date(10)

    # Register a second student
    client.post(
        "/api/auth/register",
        json={"name": "Second Student", "email": "student2@edu.com", "password": "Password123!", "role": "STUDENT"},
    )
    s2_token = client.post(
        "/api/auth/login",
        json={"email": "student2@edu.com", "password": "Password123!"},
    ).get_json()["data"]["access_token"]

    slot_id = _setup_tutor_and_slot(client, tutor_token, date_str)

    # Both students request the SAME slot
    r1_id = client.post(
        "/api/requests",
        json={"slot_id": slot_id, "subject": "Physics"},
        headers={"Authorization": f"Bearer {s1_token}"},
    ).get_json()["data"]["id"]

    r2_id = client.post(
        "/api/requests",
        json={"slot_id": slot_id, "subject": "Physics"},
        headers={"Authorization": f"Bearer {s2_token}"},
    ).get_json()["data"]["id"]

    # Tutor accepts Student 1's request
    acc1 = client.patch(f"/api/requests/{r1_id}/accept", headers={"Authorization": f"Bearer {t_token}"})
    assert acc1.status_code == 200
    assert acc1.get_json()["data"]["status"] == "ACCEPTED"

    # Competing request 2 should now automatically be DECLINED or cannot be accepted
    acc2 = client.patch(f"/api/requests/{r2_id}/accept", headers={"Authorization": f"Bearer {t_token}"})
    assert acc2.status_code in (400, 409)

    # Verify student 2's request status is DECLINED
    s2_reqs = client.get("/api/requests/my", headers={"Authorization": f"Bearer {s2_token}"}).get_json()["data"]
    req2_status = next(r["status"] for r in s2_reqs if r["id"] == r2_id)
    assert req2_status == "DECLINED"


def test_cancel_request_releases_booked_slot(client, tutor_token, student_token):
    t_token, tutor = tutor_token
    s_token, _ = student_token
    date_str = _future_date(11)

    slot_id = _setup_tutor_and_slot(client, tutor_token, date_str)

    # Request and Accept
    req_id = client.post(
        "/api/requests",
        json={"slot_id": slot_id, "subject": "Mathematics"},
        headers={"Authorization": f"Bearer {s_token}"},
    ).get_json()["data"]["id"]

    client.patch(f"/api/requests/{req_id}/accept", headers={"Authorization": f"Bearer {t_token}"})

    # Student cancels accepted request
    cancel_resp = client.patch(f"/api/requests/{req_id}/cancel", headers={"Authorization": f"Bearer {s_token}"})
    assert cancel_resp.status_code == 200
    assert cancel_resp.get_json()["data"]["status"] == "CANCELLED"

    # Verify slot is released back to AVAILABLE
    slots = client.get(f"/api/slots/tutor/{tutor['id']}").get_json()["data"]
    assert slots[0]["status"] == "AVAILABLE"
