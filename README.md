# PeerConnect 🎓

> **Team Kurukshetra** – Hackathon Project  
> **Team Members:** 1) Aditya Berad 2) Aditya Shendge 3) Shubham Gite 4) Hitendra Yeole  
> A high-performance peer tutoring and academic mentorship platform connecting students with verified peer tutors for structured, accessible, and high-impact learning.

---

## 1. Tech Stack & Architecture

| Layer | Technology | Details |
| :--- | :--- | :--- |
| **Frontend** | React 18, Vite 8, Tailwind CSS 3 | Single-page application, custom color grading, responsive layout |
| **State & Routing**| React Router v6, React Context API | Role-based protected routes, session hydration, JWT storage |
| **Backend** | Python 3.12, Flask 3, Werkzeug | REST API, modular blueprints, service-layer architecture |
| **Authentication**| Flask-JWT-Extended, PBKDF2 Hashing | Signed JWT tokens, role guards (`STUDENT`, `TUTOR`) |
| **Database** | MongoDB 8.2 (PyMongo) | ACID conditional updates, unique compound indexes |
| **WSGI Server** | Gunicorn (Linux/Containers) / Waitress | Production-ready multi-worker WSGI entry point |
| **Testing & QA** | Pytest, pytest-flask, Oxlint | 37 unit/integration tests (100% pass rate), zero lint errors |

---

## 2. Project Directory Structure

```text
PeerConnect/
├── backend/
│   ├── app/
│   │   ├── __init__.py           # Application factory, logging, global error handlers
│   │   ├── extensions.py         # Shared PyMongo and JWT extensions
│   │   ├── models/               # Data schemas & safe serializers
│   │   │   ├── user.py           # User document and password validation
│   │   │   ├── tutor_profile.py  # Tutor profile schema and public serializer
│   │   │   ├── availability.py   # Slot schema and interval validators
│   │   │   ├── session_request.py# Request schema and lifecycle transitions
│   │   │   └── review.py         # Review schema and safe review serializer
│   │   ├── routes/               # Modular Flask blueprints
│   │   │   ├── auth.py           # /api/auth (register, login, me)
│   │   │   ├── tutors.py         # /api/tutors (profiles, search, filters)
│   │   │   ├── slots.py          # /api/slots (availability schedule)
│   │   │   ├── requests.py       # /api/requests (booking, accept, decline, complete)
│   │   │   ├── reviews.py        # /api/reviews (reviews & ratings)
│   │   │   ├── dashboard.py      # /api/dashboard (student & tutor analytics)
│   │   │   └── health.py         # /api/health (liveness & DB ping)
│   │   ├── services/             # Decoupled business logic & concurrency
│   │   │   ├── auth_service.py
│   │   │   ├── tutor_service.py
│   │   │   ├── availability_service.py
│   │   │   ├── session_request_service.py
│   │   │   ├── review_service.py
│   │   │   └── dashboard_service.py
│   │   └── utils/                # Standardized JSON response helpers
│   ├── tests/                    # Automated Pytest suite (37 tests)
│   ├── run.py                    # WSGI application entry point
│   ├── requirements.txt          # Python dependencies
│   ├── .env.example              # Backend environment template
│   └── pytest.ini                # Pytest test discovery config
│
├── frontend/
│   ├── src/
│   │   ├── api/                  # Axios instance and API modules
│   │   ├── components/           # UI components, modals, cards, navigation
│   │   ├── context/              # AuthContext (JWT hydration and state)
│   │   ├── layouts/              # Public Layout and DashboardLayout
│   │   ├── pages/                # Home, FindTutors, TutorProfile, Dashboards, etc.
│   │   ├── App.jsx               # Route tree and role route guards
│   │   └── main.jsx              # React DOM entry point
│   ├── package.json              # Frontend scripts and dependencies
│   ├── vite.config.js            # Vite build configuration
│   ├── tailwind.config.js        # Design tokens and custom theme
│   └── .env.example              # Frontend environment template
│
└── README.md                     # Comprehensive documentation
```

---

## 3. Prerequisites

- **Python** ≥ 3.11 (Python 3.12 recommended)
- **Node.js** ≥ 18 (LTS recommended)
- **MongoDB** running locally on port `27017` or a cloud-hosted **MongoDB Atlas** cluster URI

---

## 4. Local Development Setup

### Step 1: Clone the Repository
```bash
git clone https://github.com/AdityaBerad01/Team-Kurukshetra.git
cd Team-Kurukshetra
```

### Step 2: Backend Setup
```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows (PowerShell):
.\venv\Scripts\Activate.ps1
# macOS / Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Create environment configuration
cp .env.example .env
```

Configure `backend/.env`:
```ini
FLASK_ENV=development
FLASK_DEBUG=1
SECRET_KEY=peerconnect-local-dev-secret-key-32chars
JWT_SECRET_KEY=peerconnect-jwt-local-secret-key-32chars
MONGO_URI=mongodb://127.0.0.1:27017/peerconnect
MONGO_DB_NAME=peerconnect
FRONTEND_ORIGIN=http://localhost:5173,http://127.0.0.1:5173
PORT=5000
```

Start the Flask development server:
```bash
flask --app run:app run --port 5000
```
API available at: `http://localhost:5000`  
Health check: `http://localhost:5000/api/health`

### Step 3: Frontend Setup
```bash
cd ../frontend

# Install dependencies
npm install

# Create environment configuration
cp .env.example .env
```

Configure `frontend/.env`:
```ini
VITE_API_BASE_URL=http://localhost:5000/api
```

Start the Vite development server:
```bash
npm run dev
```
Web application available at: `http://localhost:5173`

---

## 5. API Endpoints Reference

### Authentication (`/api/auth`)
| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :---: |
| `POST` | `/api/auth/register` | Register new user (`STUDENT` or `TUTOR`) | No |
| `POST` | `/api/auth/login` | Authenticate credentials & return JWT | No |
| `GET` | `/api/auth/me` | Fetch authenticated user profile | **Yes** (JWT) |

### Tutor Profiles & Discovery (`/api/tutors`)
| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :---: |
| `GET` | `/api/tutors` | Browse & search tutors with filters & pagination | No |
| `GET` | `/api/tutors/<id>` | Retrieve public profile of a tutor | No |
| `POST` | `/api/tutors/profile` | Create authenticated tutor profile | **Yes** (`TUTOR`) |
| `GET` | `/api/tutors/profile/me` | Fetch own tutor profile | **Yes** (`TUTOR`) |
| `PUT` | `/api/tutors/profile/me` | Update own tutor profile | **Yes** (`TUTOR`) |

### Availability Management (`/api/slots`)
| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :---: |
| `POST` | `/api/slots` | Post a new availability time slot | **Yes** (`TUTOR`) |
| `GET` | `/api/slots/tutor/<id>` | Fetch all slots for a specific tutor | No |
| `GET` | `/api/slots/available` | Query active available slots platform-wide | No |
| `PUT` | `/api/slots/<slot_id>` | Update an unbooked availability slot | **Yes** (`TUTOR`) |
| `DELETE`| `/api/slots/<slot_id>` | Delete an unbooked availability slot | **Yes** (`TUTOR`) |

### Session Requests & Booking (`/api/requests`)
| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :---: |
| `POST` | `/api/requests` | Request a tutoring session | **Yes** (`STUDENT`)|
| `GET` | `/api/requests/my` | View student's session requests | **Yes** (`STUDENT`)|
| `GET` | `/api/requests/incoming` | View tutor's incoming requests | **Yes** (`TUTOR`) |
| `GET` | `/api/requests/<id>` | Inspect session details | **Yes** (Participant) |
| `PATCH`| `/api/requests/<id>/accept`| Tutor confirms session & locks slot | **Yes** (`TUTOR`) |
| `PATCH`| `/api/requests/<id>/decline`| Tutor declines session request | **Yes** (`TUTOR`) |
| `PATCH`| `/api/requests/<id>/cancel`| Student cancels session request | **Yes** (`STUDENT`)|
| `PATCH`| `/api/requests/<id>/complete`| Mark confirmed session as completed | **Yes** (Participant)|

### Reviews & Ratings (`/api/reviews`)
| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :---: |
| `POST` | `/api/reviews` | Submit rating & review for completed session | **Yes** (`STUDENT`)|
| `GET` | `/api/tutors/<id>/reviews` | Retrieve tutor's reviews & rating distribution | No |

### Dashboards (`/api/dashboard`)
| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :---: |
| `GET` | `/api/dashboard/student` | Real-time student statistics & activity | **Yes** (`STUDENT`)|
| `GET` | `/api/dashboard/tutor` | Real-time tutor statistics & inquiries | **Yes** (`TUTOR`) |

### Health Check (`/api/health`)
| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :---: |
| `GET` | `/api/health` | Deployment liveness check with DB ping | No |

---

## 6. Environment Variables Reference

### Backend Configuration (`backend/.env`)
| Variable | Required | Default | Purpose |
| :--- | :---: | :--- | :--- |
| `FLASK_ENV` | Optional | `production` | Application mode (`production` / `development`) |
| `FLASK_DEBUG` | Optional | `0` | Disables debug console and stack traces in production |
| `SECRET_KEY` | **Required** | `dev-secret...` | Cryptographic secret for session cookies |
| `JWT_SECRET_KEY`| **Required** | `dev-jwt...` | Secret key used to sign and verify HMAC-SHA256 JWT tokens |
| `MONGO_URI` | **Required** | `mongodb://127.0.0.1:27017/peerconnect` | MongoDB connection URI |
| `MONGO_DB_NAME` | Optional | `peerconnect` | Database name override |
| `FRONTEND_ORIGIN`| **Required** | `http://localhost:5173,http://127.0.0.1:5173` | Comma-separated whitelist of allowed CORS origins |
| `PORT` | Optional | `5000` | WSGI listening port |

### Frontend Configuration (`frontend/.env`)
| Variable | Required | Example | Purpose |
| :--- | :---: | :--- | :--- |
| `VITE_API_BASE_URL` | **Required** | `http://localhost:5000/api` | Base URL pointing to Flask REST API |

> [!CAUTION]
> Never commit `.env` files to source control. Only commit `.env.example` templates. The repository's `.gitignore` rules prevent `.env` files from being staged.

---

## 7. Testing & Quality Verification

### Run Backend Tests (Pytest)
```bash
cd backend
.\venv\Scripts\pytest -v
```
**Current Test Status:** 37 / 37 passed (100% pass rate in ~26s).

### Run Frontend Static Analysis (Oxlint)
```bash
cd frontend
npm run lint
```
**Current Lint Status:** 0 warnings, 0 errors across 45 files.

### Compile Frontend Production Build (Vite)
```bash
cd frontend
npm run build
```
Generates an optimized client bundle in `frontend/dist/`.

---

## 8. Production Deployment Guide

### Option A: Standard Production WSGI Server (Linux / Render / Railway)

On production Linux hosts, run Flask using **Gunicorn**:

```bash
cd backend
pip install -r requirements.txt
gunicorn --workers 4 --bind 0.0.0.0:5000 --access-logfile - --error-logfile - run:app
```

### Option B: Cloud Platform Setup (e.g. Render, Railway, Fly.io)

1. **Backend Web Service:**
   - **Environment:** Python 3.11+
   - **Build Command:** `pip install -r backend/requirements.txt`
   - **Start Command:** `cd backend && gunicorn --workers 4 --bind 0.0.0.0:$PORT run:app`
   - **Health Check Path:** `/api/health`
   - **Environment Variables:** Set `FLASK_ENV=production`, `FLASK_DEBUG=0`, `SECRET_KEY`, `JWT_SECRET_KEY`, `MONGO_URI`, and `FRONTEND_ORIGIN`.
2. **Frontend Static Site:**
   - **Build Command:** `cd frontend && npm install && npm run build`
   - **Publish Directory:** `frontend/dist`
   - **Single Page App (SPA) Rewrites:** Set rewrite rule mapping `/*` to `/index.html`.
   - **Environment Variables:** Set `VITE_API_BASE_URL=https://<your-backend-domain>/api`.

---

## 9. MongoDB Atlas Provisioning Guide

To connect PeerConnect to **MongoDB Atlas**:

1. **Create an Atlas Account & Cluster:**
   - Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) and register.
   - Deploy a free-tier cluster (`M0 Sandbox`) on your preferred cloud provider (AWS, GCP, Azure).
2. **Configure Database User:**
   - Navigate to **Security** → **Database Access**.
   - Click **Add New Database User**.
   - Select **Password Authentication**. Provide a secure username (e.g. `peerconnect_admin`) and strong password.
   - Assign database user privileges: **Read and write to any database**.
3. **Configure Network Access (IP Whitelist):**
   - Navigate to **Security** → **Network Access**.
   - Click **Add IP Address**.
   - For containerized and cloud platforms (Render, Railway, Vercel), add `0.0.0.0/0` (Allow Access from Anywhere) or provide specific static egress IPs from your hosting provider.
4. **Obtain Connection String:**
   - Navigate to **Deployment** → **Database**.
   - Click **Connect** → **Drivers** (Python / PyMongo).
   - Copy the SRV connection URI:
     ```text
     mongodb+srv://<username>:<password>@cluster0.xxxx.mongodb.net/peerconnect?retryWrites=true&w=majority
     ```
5. **Set in Backend Environment:**
   - Update `MONGO_URI` in `backend/.env` with your connection string.

---

## 10. Database Indexes & Concurrency Architecture

The application initializes the following MongoDB indexes on startup:

- `users.email` (Unique): Prevents duplicate account creation.
- `tutor_profiles.user_id` (Unique): Ensures 1 profile per tutor.
- `tutor_profiles.subjects`: Accelerates subject search.
- `availability.tutor_id_1_date_1_status_1`: Accelerates tutor schedule retrieval.
- `reviews.request_id` (Unique): Guarantees at most 1 review per completed session request.

### Concurrency & Double-Booking Protection
To prevent double bookings, PeerConnect uses MongoDB atomic conditional operations:
```python
result = mongo.db.availability.update_one(
    {"_id": ObjectId(slot_id), "status": "AVAILABLE"},
    {"$set": {"status": "BOOKED", "updated_at": now}}
)
```
If two students concurrently attempt to book the same slot, exactly one update modifies the document (`matched_count == 1`). The competing operation fails and safely rejects the second request with `HTTP 409 Conflict`.

---

## 11. Troubleshooting

### 1. CORS Preflight Failures (`Blocked by CORS policy`)
- **Symptom:** Browser console reports `Access to XMLHttpRequest at '...' from origin '...' has been blocked by CORS policy`.
- **Resolution:**
  - Verify `FRONTEND_ORIGIN` in `backend/.env` matches your frontend URL exactly.
  - Do not include trailing slashes (e.g. use `https://myapp.com`, not `https://myapp.com/`).
  - For local development, include both `http://localhost:5173` and `http://127.0.0.1:5173`.

### 2. Database Connection Failures
- **Symptom:** Backend logs report `ServerSelectionTimeoutError` or `/api/health` returns status `503 Degraded`.
- **Resolution:**
  - Verify that MongoDB is running locally (`netstat -ano | findstr :27017` on Windows).
  - If using MongoDB Atlas, verify that your client IP is whitelisted under Atlas Network Access.
  - Verify that special characters in your Atlas password are URL-encoded if applicable.

### 3. JWT Signature Errors (HTTP 401)
- **Symptom:** User is bounced to login on page load; API returns `Signature verification failed`.
- **Resolution:** Ensure `JWT_SECRET_KEY` remains consistent across server restarts. If using a dynamically generated key on restart, tokens issued before the restart become invalid.

---

_PeerConnect – Built with precision for collaborative academic mentorship._
