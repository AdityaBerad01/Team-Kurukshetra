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
        subjects=subjects if isinstance(subjects, list) else [],
        bio=bio,
    )
    insert_result = mongo.db.users.insert_one(user_doc)
    user_id_str = str(insert_result.inserted_id)

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

    access_token = create_access_token(identity=str(user['_id']))
    safe_user = to_safe_user(user)
    return success_response(data={"user": safe_user, "access_token": access_token}, message='Login successful')

@auth_bp.route('/me', methods=['GET'])
@jwt_required()
def me():
    user_id = get_jwt_identity()
    from bson import ObjectId
    user = mongo.db.users.find_one({"_id": ObjectId(user_id)}) if user_id else None
    if not user:
        return error_response(message='User not found.', status_code=404)
    safe_user = to_safe_user(user)
    return success_response(data=safe_user, message='User profile')
