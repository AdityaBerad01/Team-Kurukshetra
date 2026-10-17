"""
Unit and integration tests for Learn-to-Earn Credit System and Learning Progress Assessments.
"""
import pytest
from app.extensions import mongo


def test_credits_initial_balance_and_wallet(client, student_token):
    token, _ = student_token

    # 1. Fetch wallet
    wallet_resp = client.get(
        "/api/credits/wallet",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert wallet_resp.status_code == 200
    wallet = wallet_resp.get_json()["data"]
    assert wallet["balance"] == 100
    assert len(wallet["transactions"]) >= 1
    assert wallet["transactions"][0]["type"] == "INITIAL_BONUS"


def test_session_completion_credit_transfer_and_idempotency(client, student_token, tutor_token):
    s_token, s_user = student_token
    t_token, t_user = tutor_token

    # 1. Tutor creates profile & slot
    client.post(
        "/api/tutors/profile",
        json={"subjects": ["Physics"], "teaching_modes": ["ONLINE"], "hourly_rate": 300},
        headers={"Authorization": f"Bearer {t_token}"},
    )
    slot_res = client.post(
        "/api/slots",
        json={"date": "2026-12-10", "start_time": "14:00", "end_time": "15:00", "teaching_mode": "ONLINE"},
        headers={"Authorization": f"Bearer {t_token}"},
    )
    slot_id = slot_res.get_json()["data"]["id"]

    # 2. Student books slot
    req_res = client.post(
        "/api/requests",
        json={"tutor_id": t_user["id"], "slot_id": slot_id, "subject": "Physics", "message": "Need help with mechanics"},
        headers={"Authorization": f"Bearer {s_token}"},
    )
    req_id = req_res.get_json()["data"]["id"]

    # 3. Tutor accepts
    client.patch(
        f"/api/requests/{req_id}/accept",
        headers={"Authorization": f"Bearer {t_token}"},
    )

    # Check initial balances
    s_wallet_pre = client.get("/api/credits/wallet", headers={"Authorization": f"Bearer {s_token}"}).get_json()["data"]
    t_wallet_pre = client.get("/api/credits/wallet", headers={"Authorization": f"Bearer {t_token}"}).get_json()["data"]
    assert s_wallet_pre["balance"] == 100
    assert t_wallet_pre["balance"] == 100

    # 4. Complete session
    comp_res = client.patch(
        f"/api/requests/{req_id}/complete",
        headers={"Authorization": f"Bearer {t_token}"},
    )
    assert comp_res.status_code == 200

    # 5. Verify credit transfer in wallet
    s_wallet_post = client.get("/api/credits/wallet", headers={"Authorization": f"Bearer {s_token}"}).get_json()["data"]
    t_wallet_post = client.get("/api/credits/wallet", headers={"Authorization": f"Bearer {t_token}"}).get_json()["data"]

    assert s_wallet_post["balance"] == 80  # 100 - 20 fee
    assert s_wallet_post["total_spent"] == 20
    assert t_wallet_post["balance"] == 120  # 100 + 20 fee
    assert t_wallet_post["total_earned"] == 20

    # 6. Verify idempotency - duplicate completion cannot double debit
    comp_repeat = client.patch(
        f"/api/requests/{req_id}/complete",
        headers={"Authorization": f"Bearer {t_token}"},
    )
    assert comp_repeat.status_code == 400

    # Balances must remain exactly unchanged
    s_wallet_repeat = client.get("/api/credits/wallet", headers={"Authorization": f"Bearer {s_token}"}).get_json()["data"]
    assert s_wallet_repeat["balance"] == 80


def test_assessments_lifecycle_and_progress(client, student_token, tutor_token):
    s_token, s_user = student_token
    t_token, t_user = tutor_token

    # 1. Tutor creates diagnostic assessment
    create_res = client.post(
        "/api/assessments",
        json={
            "title": "Calculus Mechanics Pre-Assessment",
            "subject": "Mathematics",
            "student_id": s_user["id"],
            "assessment_type": "PRE_SESSION",
            "questions": [
                {
                    "id": "q1",
                    "question": "What is the derivative of sin(x)?",
                    "options": ["cos(x)", "-cos(x)", "tan(x)", "sec^2(x)"],
                    "correct_index": 0,
                    "explanation": "d/dx[sin(x)] = cos(x)",
                },
                {
                    "id": "q2",
                    "question": "What is integral of 2x dx?",
                    "options": ["x^2 + C", "2x^2 + C", "x + C", "2 + C"],
                    "correct_index": 0,
                    "explanation": "Integral of 2x is x^2 + C",
                },
            ],
        },
        headers={"Authorization": f"Bearer {t_token}"},
    )
    assert create_res.status_code == 201
    assessment_id = create_res.get_json()["data"]["id"]

    # 2. Student fetches their assessments
    my_res = client.get("/api/assessments/my", headers={"Authorization": f"Bearer {s_token}"})
    assert my_res.status_code == 200
    assessments = my_res.get_json()["data"]
    assert len(assessments) >= 1

    # 3. Student submits correct answers
    sub_res = client.post(
        f"/api/assessments/{assessment_id}/submit",
        json={"answers": {"q1": 0, "q2": 0}},
        headers={"Authorization": f"Bearer {s_token}"},
    )
    assert sub_res.status_code == 200
    result = sub_res.get_json()["data"]
    assert result["score"] == 100
    assert result["status"] == "SUBMITTED"

    # 4. Check progress summary
    prog_res = client.get("/api/assessments/progress", headers={"Authorization": f"Bearer {s_token}"})
    assert prog_res.status_code == 200
    prog = prog_res.get_json()["data"]
    assert prog["total_quizzes_completed"] >= 1
    assert prog["average_score"] == 100


def test_update_user_profile_put_me(client, student_token):
    token, _ = student_token

    put_res = client.put(
        "/api/auth/me",
        json={
            "name": "Jane Scholar",
            "university": "Pune Institute of Computer Technology",
            "campus": "Dhankawadi Campus",
            "languages": ["English", "Marathi"],
            "learning_goals": "Master Dynamic Programming and Graph Algorithms",
            "skill_level": "Advanced",
        },
        headers={"Authorization": f"Bearer {token}"},
    )
    assert put_res.status_code == 200
    user_data = put_res.get_json()["data"]
    assert user_data["name"] == "Jane Scholar"
    assert user_data["campus"] == "Dhankawadi Campus"
    assert "Marathi" in user_data["languages"]
    assert user_data["skill_level"] == "Advanced"
