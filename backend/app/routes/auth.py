from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from werkzeug.security import generate_password_hash, check_password_hash

from app.extensions import mongo
from app.models.user import new_user, to_safe_user, validate_email_format, VALID_ROLES
from app.utils.responses import success_response, error_response

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/register', methods=['POST'])
def register():
    data = request.get_json() or {}
    name = data.get('name', '').strip()
    email = data.get('email', '').strip()
    password = data.get('password', '')
    role = data.get('role', '').strip().upper()
    university = data.get('university', '').strip()
    campus = data.get('campus', university).strip()
    languages = data.get('languages', ['English'])
    learning_goals = data.get('learning_goals', '').strip()
    skill_level = data.get('skill_level', 'Intermediate').strip()
    subjects = data.get('subjects', [])
    bio = data.get('bio', '').strip()

    # Basic validation
    errors = {}
    if not name:
        errors['name'] = 'Name is required.'
    if not email or not validate_email_format(email):
        errors['email'] = 'A valid email address is required.'
    if not password or len(password) < 8:
        errors['password'] = 'Password must be at least 8 characters.'
    if role not in VALID_ROLES:
        errors['role'] = f"Role must be one of {', '.join(VALID_ROLES)}."

    if errors:
        return error_response(message='Validation failed', status_code=400)

    # Duplicate check
    if mongo.db.users.find_one({"email": email.lower()}):
        return error_response(message='An account with this email already exists.', status_code=409)

    password_hash = generate_password_hash(password)
    user_doc = new_user(
        name=name,
        email=email,
        password_hash=password_hash,
        role=role,
        university=university,
        campus=campus,
        languages=languages if isinstance(languages, list) else ['English'],
        learning_goals=learning_goals,
        skill_level=skill_level,
        subjects=subjects if isinstance(subjects, list) else [],
        bio=bio,
    )
    insert_result = mongo.db.users.insert_one(user_doc)
    user_id_str = str(insert_result.inserted_id)

    # Automatically grant starting credit balance & ledger entry
    from app.services.credit_service import ensure_initial_balance
    ensure_initial_balance(user_id_str)

    # If tutor registered with subjects, automatically create initial tutor profile
    if role == 'TUTOR' and isinstance(subjects, list) and len(subjects) > 0:
        from app.models.tutor_profile import new_tutor_profile
        tutor_doc = new_tutor_profile(
            user_id=user_id_str,
            subjects=subjects,
            introduction=bio,
            department=data.get('department', ''),
            year_of_study=str(data.get('year_of_study', '')),
            teaching_modes=['ONLINE'],
            hourly_rate=data.get('hourly_rate', 300),
        )
        tutor_doc["languages"] = languages if isinstance(languages, list) else ["English"]
        tutor_doc["campus"] = campus
        mongo.db.tutor_profiles.insert_one(tutor_doc)

    safe_user = to_safe_user(mongo.db.users.find_one({"_id": insert_result.inserted_id}))
    access_token = create_access_token(identity=user_id_str)
    safe_user['access_token'] = access_token
    return success_response(data=safe_user, message='Registration successful', status_code=201)

@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json() or {}
    email = data.get('email', '').strip()
    password = data.get('password', '')

    if not email or not password:
        return error_response(message='Email and password are required.', status_code=400)

    user = mongo.db.users.find_one({"email": email.lower()})
    if not user or not check_password_hash(user.get('password_hash', ''), password):
        return error_response(message='Invalid credentials.', status_code=401)

    user_id_str = str(user['_id'])
    from app.services.credit_service import ensure_initial_balance
    ensure_initial_balance(user_id_str)

    access_token = create_access_token(identity=user_id_str)
    safe_user = to_safe_user(user)
    return success_response(data={"user": safe_user, "access_token": access_token}, message='Login successful')

@auth_bp.route('/me', methods=['GET', 'PUT'])
@jwt_required()
def me():
    user_id = get_jwt_identity()
    from bson import ObjectId
    user_oid = ObjectId(user_id) if user_id else None
    user = mongo.db.users.find_one({"_id": user_oid}) if user_oid else None
    if not user:
        return error_response(message='User not found.', status_code=404)

    if request.method == 'PUT':
        data = request.get_json() or {}
        update_fields = {}
        if 'name' in data and str(data['name']).strip():
            update_fields['name'] = str(data['name']).strip()
        if 'university' in data:
            update_fields['university'] = str(data['university']).strip()
        if 'campus' in data:
            update_fields['campus'] = str(data['campus']).strip()
        if 'bio' in data:
            update_fields['bio'] = str(data['bio']).strip()
        if 'languages' in data and isinstance(data['languages'], list):
            update_fields['languages'] = [str(l).strip() for l in data['languages'] if str(l).strip()]
        if 'learning_goals' in data:
            update_fields['learning_goals'] = str(data['learning_goals']).strip()
        if 'skill_level' in data:
            update_fields['skill_level'] = str(data['skill_level']).strip()
        if 'subjects_to_learn' in data and isinstance(data['subjects_to_learn'], list):
            update_fields['subjects_to_learn'] = [str(s).strip() for s in data['subjects_to_learn'] if str(s).strip()]
        if 'subjects' in data and isinstance(data['subjects'], list):
            update_fields['subjects'] = [str(s).strip() for s in data['subjects'] if str(s).strip()]

        if update_fields:
            from datetime import datetime, timezone
            update_fields['updated_at'] = datetime.now(timezone.utc)
            mongo.db.users.update_one({"_id": user_oid}, {"$set": update_fields})
            user = mongo.db.users.find_one({"_id": user_oid})

    safe_user = to_safe_user(user)
    return success_response(data=safe_user, message='User profile')
