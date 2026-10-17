"""
Tests for Tutor Profile and Discovery Endpoints.
"""


def test_create_tutor_profile_success(client, tutor_token):
    token, user = tutor_token
    payload = {
        "subjects": ["Physics", "Mathematics"],
        "introduction": "Experienced physics mentor with focus on mechanics.",
        "department": "Physics",
        "year_of_study": "PhD Final Year",
        "teaching_modes": ["ONLINE", "ON_CAMPUS"],
        "hourly_rate": 350,
        "availability": ["Monday", "Wednesday", "Friday"],
    }
    resp = client.post(
        "/api/tutors/profile",
        json=payload,
        headers={"Authorization": f"Bearer {token}"},
    )
    assert resp.status_code == 201
    data = resp.get_json()
    assert data["success"] is True
    assert data["data"]["name"] == "Dr. Raman"
    assert "Physics" in data["data"]["subjects"]
    assert "ONLINE" in data["data"]["teaching_modes"]
    assert "Online" in data["data"]["mode"]
    assert "In-person" in data["data"]["mode"]
    assert "password_hash" not in data["data"]
    assert "email" not in data["data"]


def test_student_cannot_create_tutor_profile(client, student_token):
    token, _ = student_token
    payload = {
        "subjects": ["Mathematics"],
        "introduction": "I am a student wanting to tutor.",
        "teaching_modes": ["ONLINE"],
    }
    resp = client.post(
        "/api/tutors/profile",
        json=payload,
        headers={"Authorization": f"Bearer {token}"},
    )
    assert resp.status_code == 403
    data = resp.get_json()
    assert data["success"] is False
    assert "TUTOR" in data["message"]


def test_unauthenticated_cannot_create_or_edit_profile(client):
    # Without token
    resp = client.post("/api/tutors/profile", json={"subjects": ["Math"]})
    assert resp.status_code == 401

    resp2 = client.put("/api/tutors/profile/me", json={"introduction": "Hacked"})
    assert resp2.status_code == 401

    resp3 = client.get("/api/tutors/profile/me")
    assert resp3.status_code == 401


def test_validate_required_fields_and_modes(client, tutor_token):
    token, _ = tutor_token

    # Missing subjects
    resp = client.post(
        "/api/tutors/profile",
        json={"introduction": "Hi", "teaching_modes": ["ONLINE"]},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert resp.status_code == 400
    assert "subject" in resp.get_json()["message"].lower()

    # Empty subjects list
    resp2 = client.post(
        "/api/tutors/profile",
        json={"subjects": [], "teaching_modes": ["ONLINE"]},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert resp2.status_code == 400

    # Invalid teaching mode
    resp3 = client.post(
        "/api/tutors/profile",
        json={"subjects": ["Chemistry"], "teaching_modes": ["FLYING_CARPET"]},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert resp3.status_code == 400
    assert "Invalid teaching mode" in resp3.get_json()["message"]


def test_update_tutor_profile(client, tutor_token):
    token, _ = tutor_token

    # First create
    client.post(
        "/api/tutors/profile",
        json={
            "subjects": ["Chemistry"],
            "introduction": "Initial bio",
            "teaching_modes": ["ONLINE"],
        },
        headers={"Authorization": f"Bearer {token}"},
    )

    # Now update
    update_payload = {
        "subjects": ["Chemistry", "Organic Chemistry"],
        "introduction": "Updated bio with new achievements.",
        "teaching_modes": ["ONLINE", "ON_CAMPUS"],
        "hourly_rate": 450,
    }
    resp = client.put(
        "/api/tutors/profile/me",
        json=update_payload,
        headers={"Authorization": f"Bearer {token}"},
    )
    assert resp.status_code == 200
    data = resp.get_json()["data"]
    assert "Organic Chemistry" in data["subjects"]
    assert data["introduction"] == "Updated bio with new achievements."
    assert data["hourly_rate"] == 450


def test_get_own_profile(client, tutor_token):
    token, _ = tutor_token

    # Before creating
    resp = client.get(
        "/api/tutors/profile/me",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert resp.status_code == 404

    # Create
    client.post(
        "/api/tutors/profile",
        json={"subjects": ["Biology"], "teaching_modes": ["ONLINE"]},
        headers={"Authorization": f"Bearer {token}"},
    )

    # After creating
    resp2 = client.get(
        "/api/tutors/profile/me",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert resp2.status_code == 200
    assert resp2.get_json()["data"]["subjects"] == ["Biology"]


def test_prevent_duplicate_profile_creation(client, tutor_token):
    token, _ = tutor_token
    payload = {"subjects": ["Art"], "teaching_modes": ["ONLINE"]}

    resp1 = client.post(
        "/api/tutors/profile",
        json=payload,
        headers={"Authorization": f"Bearer {token}"},
    )
    assert resp1.status_code == 201

    # Second creation attempt must fail
    resp2 = client.post(
        "/api/tutors/profile",
        json=payload,
        headers={"Authorization": f"Bearer {token}"},
    )
    assert resp2.status_code == 409
    assert "already exists" in resp2.get_json()["message"]


def test_search_and_filter_tutors(client):
    # Register 2 tutors
    t1_reg = client.post(
        "/api/auth/register",
        json={"name": "Alice Calculus", "email": "alice@tu.edu", "password": "Password123!", "role": "TUTOR"},
    )
    t1_token = client.post(
        "/api/auth/login",
        json={"email": "alice@tu.edu", "password": "Password123!"},
    ).get_json()["data"]["access_token"]

    client.post(
        "/api/tutors/profile",
        json={
            "subjects": ["Calculus", "Linear Algebra"],
            "introduction": "Math enthusiast",
            "teaching_modes": ["ONLINE"],
            "availability": ["Monday", "Tuesday"],
        },
        headers={"Authorization": f"Bearer {t1_token}"},
    )

    t2_reg = client.post(
        "/api/auth/register",
        json={"name": "Bob Quantum", "email": "bob@tu.edu", "password": "Password123!", "role": "TUTOR"},
    )
    t2_token = client.post(
        "/api/auth/login",
        json={"email": "bob@tu.edu", "password": "Password123!"},
    ).get_json()["data"]["access_token"]

    client.post(
        "/api/tutors/profile",
        json={
            "subjects": ["Quantum Physics", "Astronomy"],
            "introduction": "Astrophysicist",
            "teaching_modes": ["ON_CAMPUS"],
            "availability": ["Wednesday", "Thursday"],
        },
        headers={"Authorization": f"Bearer {t2_token}"},
    )

    # 1. Search by name
    res = client.get("/api/tutors?q=Alice")
    assert res.status_code == 200
    tutors = res.get_json()["data"]["tutors"]
    assert len(tutors) == 1
    assert tutors[0]["name"] == "Alice Calculus"

    # 2. Search by subject
    res = client.get("/api/tutors?subject=Quantum")
    assert res.status_code == 200
    tutors = res.get_json()["data"]["tutors"]
    assert len(tutors) == 1
    assert tutors[0]["name"] == "Bob Quantum"

    # 3. Filter by teaching mode
    res_online = client.get("/api/tutors?mode=ONLINE")
    assert res_online.status_code == 200
    online_tutors = res_online.get_json()["data"]["tutors"]
    assert all("ONLINE" in t["teaching_modes"] for t in online_tutors)
    assert any(t["name"] == "Alice Calculus" for t in online_tutors)

    res_campus = client.get("/api/tutors?mode=ON_CAMPUS")
    assert res_campus.status_code == 200
    campus_tutors = res_campus.get_json()["data"]["tutors"]
    assert any(t["name"] == "Bob Quantum" for t in campus_tutors)

    # 4. Filter by availability date (e.g. 2026-10-19 is a Monday)
    res_date = client.get("/api/tutors?date=2026-10-19")
    assert res_date.status_code == 200
    date_tutors = res_date.get_json()["data"]["tutors"]
    assert any(t["name"] == "Alice Calculus" for t in date_tutors)

    # 5. Empty search results
    res_empty = client.get("/api/tutors?q=NonExistentSubject123")
    assert res_empty.status_code == 200
    data_empty = res_empty.get_json()["data"]
    assert data_empty["tutors"] == []
    assert data_empty["total"] == 0

    # 6. Pagination
    res_page = client.get("/api/tutors?page=1&per_page=1")
    assert res_page.status_code == 200
    data_page = res_page.get_json()["data"]
    assert len(data_page["tutors"]) == 1
    assert data_page["total"] == 2
    assert data_page["total_pages"] == 2


def test_get_tutor_details_by_id(client, tutor_token):
    token, _ = tutor_token
    create_resp = client.post(
        "/api/tutors/profile",
        json={
            "subjects": ["Economics"],
            "introduction": "Macroeconomics specialist",
            "teaching_modes": ["ONLINE"],
        },
        headers={"Authorization": f"Bearer {token}"},
    )
    profile_id = create_resp.get_json()["data"]["id"]

    # Public get
    detail_resp = client.get(f"/api/tutors/{profile_id}")
    assert detail_resp.status_code == 200
    detail = detail_resp.get_json()["data"]
    assert detail["name"] == "Dr. Raman"
    assert detail["subjects"] == ["Economics"]
    assert "email" not in detail
    assert "password_hash" not in detail

    # Non-existent ID
    bad_resp = client.get("/api/tutors/64b1f2000000000000000000")
    assert bad_resp.status_code == 404


def test_get_tutor_recommendations(client, tutor_token):
    token, _ = tutor_token
    client.post(
        "/api/tutors/profile",
        json={
            "subjects": ["Data Structures", "Algorithms"],
            "introduction": "DSA mentor with high availability",
            "teaching_modes": ["ONLINE", "ON_CAMPUS"],
        },
        headers={"Authorization": f"Bearer {token}"},
    )

    # 1. Fetch general recommendations
    rec_res = client.get("/api/tutors/recommendations")
    assert rec_res.status_code == 200
    rec_data = rec_res.get_json()["data"]
    assert "recommendations" in rec_data
    assert len(rec_data["recommendations"]) >= 1

    # 2. Fetch subject-filtered recommendation
    dsa_res = client.get("/api/tutors/recommendations?subject=Data Structures")
    assert dsa_res.status_code == 200
    dsa_tutors = dsa_res.get_json()["data"]["recommendations"]
    assert len(dsa_tutors) >= 1
    assert any("Data Structures" in t.get("reasons", [""])[0] for t in dsa_tutors)

