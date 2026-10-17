import json
import sys
import urllib.request
import urllib.error
import uuid

BASE_URL = "http://127.0.0.1:5000/api"

def make_req(method, endpoint, data=None, token=None):
    url = f"{BASE_URL}{endpoint}"
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    
    body = json.dumps(data).encode("utf-8") if data is not None else None
    req = urllib.request.Request(url, data=body, headers=headers, method=method)
    
    try:
        with urllib.request.urlopen(req) as resp:
            resp_body = resp.read().decode("utf-8")
            return resp.status, json.loads(resp_body) if resp_body else {}
    except urllib.error.HTTPError as e:
        err_body = e.read().decode("utf-8")
        try:
            parsed = json.loads(err_body)
        except Exception:
            parsed = {"raw": err_body}
        return e.code, parsed

def run_e2e_test():
    print("=== STARTING PEERCONNECT FULL-STACK LIVE HTTP INTEGRATION TEST ===")
    
    # 1. Health check
    print("\n1. Verifying API Health...")
    status, health_data = make_req("GET", "/health")
    assert status == 200, f"Health check failed: {health_data}"
    assert health_data.get("status") == "ok", f"Health status not ok: {health_data}"
    assert health_data.get("database") == "ok", f"Database status not ok: {health_data}"
    print("   [PASS] Health endpoint ok, database connected.")

    # Generate unique test users
    uid = uuid.uuid4().hex[:6]
    student_email = f"student_{uid}@college.edu"
    tutor_email = f"tutor_{uid}@college.edu"
    password = "SecurePassword123!"

    # 2. Register Student
    print("\n2. Testing Student Registration...")
    student_payload = {
        "name": f"Student Test {uid}",
        "email": student_email,
        "password": password,
        "role": "STUDENT",
        "university": "State University",
        "campus": "North Campus",
        "languages": ["English", "Hindi"],
        "learning_goals": "Master Linear Algebra & Algorithms",
        "skill_level": "Beginner"
    }
    status, res = make_req("POST", "/auth/register", student_payload)
    assert status == 201, f"Student registration failed: {res}"
    student_data = res.get("data", {})
    student_token = student_data.get("access_token")
    student_id = student_data.get("id")
    assert student_token, "No access token returned for student"
    assert student_data.get("credits") == 100, f"Initial credits not 100: {student_data.get('credits')}"
    print(f"   [PASS] Student registered: {student_id} with 100 learning credits.")

    # 3. Register Tutor
    print("\n3. Testing Tutor Registration...")
    tutor_payload = {
        "name": f"Tutor Prof {uid}",
        "email": tutor_email,
        "password": password,
        "role": "TUTOR",
        "university": "State University",
        "campus": "North Campus",
        "languages": ["English", "Hindi", "Marathi"],
        "subjects": ["Mathematics", "Computer Science"],
        "bio": "Experienced peer educator in Discrete Math & Python.",
        "hourly_rate": 350
    }
    status, res = make_req("POST", "/auth/register", tutor_payload)
    assert status == 201, f"Tutor registration failed: {res}"
    tutor_data = res.get("data", {})
    tutor_token = tutor_data.get("access_token")
    tutor_id = tutor_data.get("id")
    assert tutor_token, "No access token returned for tutor"
    assert tutor_data.get("credits") == 100, f"Initial credits not 100: {tutor_data.get('credits')}"
    print(f"   [PASS] Tutor registered: {tutor_id} with 100 learning credits.")

    # 4. Duplicate Email Rejection
    print("\n4. Testing Duplicate Email Rejection...")
    status, res_dup = make_req("POST", "/auth/register", student_payload)
    assert status == 409, f"Expected 409 on duplicate email, got: {status}"
    print("   [PASS] Duplicate email rejected with 409 Conflict.")

    # 5. Login Authentication
    print("\n5. Testing Login Authentication...")
    # Bad credentials
    status, res_bad = make_req("POST", "/auth/login", {"email": student_email, "password": "WrongPassword"})
    assert status == 401, f"Expected 401 on bad password, got {status}"
    # Correct credentials
    status, res_login = make_req("POST", "/auth/login", {"email": student_email, "password": password})
    assert status == 200, f"Login failed: {res_login}"
    login_token = res_login.get("data", {}).get("access_token")
    assert login_token, "No token returned on valid login"
    print("   [PASS] Invalid credentials rejected with 401; Valid login returns JWT.")

    # 6. Profile Edit via PUT /api/auth/me
    print("\n6. Testing Profile Edit via PUT /api/auth/me...")
    status, res_prof = make_req("PUT", "/auth/me", {
        "name": f"Student Updated {uid}",
        "bio": "Updated student bio for test.",
        "languages": ["English", "Marathi"]
    }, token=student_token)
    assert status == 200, f"Profile update failed: {res_prof}"
    updated_user = res_prof.get("data", {})
    assert updated_user.get("name") == f"Student Updated {uid}"
    assert "Marathi" in updated_user.get("languages", [])
    print("   [PASS] Profile updated and verified in DB.")

    # 7. Tutor Profile and Search Discovery
    print("\n7. Testing Tutor Profile & Search Discovery...")
    # Check tutor public profile
    status, res_tutor_get = make_req("GET", f"/tutors/{tutor_id}")
    assert status == 200, f"Fetch tutor failed: {res_tutor_get}"
    # Search tutors with subject & language filter
    status, res_search = make_req("GET", "/tutors?subject=Mathematics&language=Marathi")
    assert status == 200, f"Search failed: {res_search}"
    search_data = res_search.get("data", {})
    tutors_list = search_data.get("tutors", [])
    matching = [t for t in tutors_list if t.get("user_id") == tutor_id or t.get("id") == tutor_id]
    assert len(matching) > 0, f"Created tutor not found in search results: {tutors_list}"
    print("   [PASS] Tutor discovered via search with subject & language filters.")

    # 8. Tutor Availability Slot Creation
    print("\n8. Testing Tutor Availability Slot Creation...")
    slot_payload = {
        "date": "2026-10-25",
        "start_time": "14:00",
        "end_time": "15:00",
        "teaching_mode": "ONLINE"
    }
    status, res_slot = make_req("POST", "/slots", slot_payload, token=tutor_token)
    assert status == 201, f"Create slot failed: {res_slot}"
    slot_data = res_slot.get("data", {})
    slot_id = slot_data.get("id")
    assert slot_id, "No slot ID returned"
    print(f"   [PASS] Availability slot created: {slot_id} (ONLINE, 14:00-15:00).")

    # 9. Session Booking Request by Student
    print("\n9. Testing Session Request Booking by Student...")
    req_payload = {
        "slot_id": slot_id,
        "subject": "Mathematics",
        "message": "Need help preparing for midterm exam."
    }
    status, res_book = make_req("POST", "/requests", req_payload, token=student_token)
    assert status == 201, f"Booking request failed: {res_book}"
    req_data = res_book.get("data", {})
    req_id = req_data.get("id")
    assert req_id, "No request ID returned"
    assert req_data.get("status") == "PENDING"
    print(f"   [PASS] Session requested: {req_id} (Status: PENDING).")

    # 10. Booking Conflict Protection (Duplicate Booking on same slot)
    print("\n10. Testing Booking Conflict Protection...")
    status, res_conflict = make_req("POST", "/requests", req_payload, token=student_token)
    assert status in (400, 409), f"Expected 400 or 409 for duplicate request on same slot, got {status}"
    print(f"   [PASS] Conflicting duplicate request prevented with status {status}.")

    # 11. Tutor Accepts Request
    print("\n11. Testing Tutor Accepts Session Request...")
    status, res_accept = make_req("PATCH", f"/requests/{req_id}/accept", token=tutor_token)
    assert status == 200, f"Accept failed: {res_accept}"
    assert res_accept.get("data", {}).get("status") == "ACCEPTED"
    print("   [PASS] Session accepted (Status: ACCEPTED).")

    # 12. Complete Session and Transfer Learn-to-Earn Credits
    print("\n12. Testing Session Completion & Credit Transfer...")
    # Check student balance before completion
    status, res_w_pre = make_req("GET", "/credits/wallet", token=student_token)
    assert status == 200
    student_bal_pre = res_w_pre.get("data", {}).get("balance", 100)

    # Complete session
    status, res_comp = make_req("PATCH", f"/requests/{req_id}/complete", token=tutor_token)
    assert status == 200, f"Complete session failed: {res_comp}"
    assert res_comp.get("data", {}).get("status") == "COMPLETED"

    # Verify student debited 20 credits and tutor credited 20 credits
    status, res_w_student = make_req("GET", "/credits/wallet", token=student_token)
    student_bal_post = res_w_student.get("data", {}).get("balance")
    assert student_bal_post == student_bal_pre - 20, f"Expected student bal {student_bal_pre - 20}, got {student_bal_post}"

    status, res_w_tutor = make_req("GET", "/credits/wallet", token=tutor_token)
    tutor_bal = res_w_tutor.get("data", {}).get("balance")
    assert tutor_bal == 120, f"Expected tutor bal 120, got {tutor_bal}"

    # Idempotency check: complete request again
    status, res_repeat = make_req("PATCH", f"/requests/{req_id}/complete", token=tutor_token)
    assert status == 400, f"Expected 400 on already completed session, got {status}"
    print(f"   [PASS] Session completed. Student balance: {student_bal_post} (-20), Tutor balance: {tutor_bal} (+20). Idempotency verified.")

    # 13. Student Submits Review
    print("\n13. Testing Review Submission & Rating Calculation...")
    review_payload = {
        "request_id": req_id,
        "rating": 5,
        "comment": "Outstanding tutor! Explained calculus and proofs clearly."
    }
    status, res_rev = make_req("POST", "/reviews", review_payload, token=student_token)
    assert status == 201, f"Review submission failed: {res_rev}"
    
    # Verify review in tutor's reviews
    status, res_tutor_revs = make_req("GET", f"/tutors/{tutor_id}/reviews")
    assert status == 200, f"Fetch tutor reviews failed: {res_tutor_revs}"
    revs_data = res_tutor_revs.get("data", {})
    assert revs_data.get("average_rating") == 5.0
    assert revs_data.get("total_reviews") == 1
    print("   [PASS] Review saved and tutor average rating calculated: 5.0 (1 review).")

    # 14. Prevent Duplicate Review
    print("\n14. Testing Duplicate Review Prevention...")
    status, res_rev_dup = make_req("POST", "/reviews", review_payload, token=student_token)
    assert status in (400, 409), f"Expected 400 or 409 for duplicate review, got {status}"
    print(f"   [PASS] Duplicate review rejected with status {status}.")

    # 15. Learning Progress & Diagnostic Quiz
    print("\n15. Testing Learning Progress & Quiz Evaluation...")
    # Tutor creates an assessment for the student
    quiz_payload = {
        "student_id": student_id,
        "title": "Calculus & Limits Diagnostic",
        "subject": "Mathematics",
        "assessment_type": "PRE_SESSION",
        "questions": [
            {
                "id": "q1",
                "question": "What is the limit of sin(x)/x as x approaches 0?",
                "options": ["0", "1", "Infinity", "Undefined"],
                "correct_index": 1,
                "explanation": "Standard trigonometric limit theorem."
            },
            {
                "id": "q2",
                "question": "What is the derivative of x^2?",
                "options": ["x", "2x", "2", "x^3/3"],
                "correct_index": 1,
                "explanation": "Power rule: d/dx(x^n) = n*x^(n-1)."
            }
        ]
    }
    status, res_create_quiz = make_req("POST", "/assessments", quiz_payload, token=tutor_token)
    assert status == 201, f"Create assessment failed: {res_create_quiz}"
    created_quiz_id = res_create_quiz.get("data", {}).get("id")
    assert created_quiz_id, "No quiz ID returned"
    print(f"   [PASS] Tutor authored diagnostic quiz: {created_quiz_id}")

    # Student fetches assigned assessments
    status, res_my_assess = make_req("GET", "/assessments/my", token=student_token)
    assert status == 200, f"My assessments failed: {res_my_assess}"
    assessments_list = res_my_assess.get("data", [])
    assert any(q.get("id") == created_quiz_id for q in assessments_list), "Created quiz not in student assessments list"

    # Student submits 100% correct answers
    answers_payload = {"q1": 1, "q2": 1}
    status, res_submit_quiz = make_req("POST", f"/assessments/{created_quiz_id}/submit", {"answers": answers_payload}, token=student_token)
    assert status == 200, f"Submit quiz failed: {res_submit_quiz}"
    res_data = res_submit_quiz.get("data", {})
    assert res_data.get("score") == 100, f"Expected 100% score, got {res_data.get('score')}"
    print(f"   [PASS] Student submitted quiz and auto-graded: 100% score.")

    # Fetch updated student progress summary
    status, res_prog = make_req("GET", "/assessments/progress", token=student_token)
    assert status == 200, f"Progress summary failed: {res_prog}"
    prog_data = res_prog.get("data", {})
    assert prog_data.get("total_quizzes_completed", 0) >= 1
    assert "average_score" in prog_data
    assert "topics_mastered" in prog_data
    print(f"   [PASS] Progress metrics verified. Average score: {prog_data.get('average_score')}%.")

    # 16. Security & Authorization Checks
    print("\n16. Testing Security & Unauthorized Access...")
    # Unauthorized access to wallet without token
    status, res_unauth = make_req("GET", "/credits/wallet")
    assert status == 401, f"Expected 401 without token, got {status}"
    # Tutor attempting to cancel student request
    status, res_unauth_cancel = make_req("PATCH", f"/requests/{req_id}/cancel", token=tutor_token)
    assert status in (400, 403), f"Expected 400/403 for unauthorized cancel, got {status}"
    print("   [PASS] Protected endpoints reject unauthenticated and unauthorized requests.")

    print("\n=== ALL 16 FULL-STACK END-TO-END INTEGRATION TESTS PASSED SUCCESSFULLY! ===")

if __name__ == "__main__":
    try:
        run_e2e_test()
    except AssertionError as e:
        print(f"\n[FAIL] Test assertion failed: {e}")
        sys.exit(1)
    except Exception as e:
        print(f"\n[ERROR] Unexpected error: {e}")
        sys.exit(1)
