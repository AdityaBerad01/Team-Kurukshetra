# PeerConnect 🎓

> **Team Kurushtra** – Hackathon Project  
> \*\*Team Members : 1) Aditya Berad 2) Aditya Shendge 3) Shubham Gite 4) Hitendra Yeole
> A peer tutoring platform connecting students with peer tutors for collaborative, affordable learning.

---

## Tech Stack

| Layer    | Technology                                             |
| -------- | ------------------------------------------------------ |
| Frontend | React 18, Vite, Tailwind CSS 3, React Router v6, Axios |
| Backend  | Python 3.12, Flask 3, Flask-CORS, Flask-JWT-Extended   |
| Database | MongoDB (PyMongo + Flask-PyMongo)                      |
| Testing  | Pytest, pytest-flask                                   |

---

## Project Structure

```
PeerConnect/
├── backend/
│   ├── app/
│   │   ├── __init__.py       # Application factory
│   │   ├── extensions.py     # Shared extensions (PyMongo)
│   │   ├── routes/           # Flask blueprints
│   │   ├── models/           # MongoDB document helpers
│   │   ├── services/         # Business logic
│   │   └── utils/            # Response helpers
│   ├── tests/                # Pytest tests
│   ├── run.py                # Entry point
│   ├── requirements.txt
│   └── pytest.ini
└── frontend/
    ├── src/
    │   ├── api/              # Axios instance + API modules
    │   ├── components/       # Navbar, Footer
    │   ├── layouts/          # Layout wrapper
    │   └── pages/            # Home, NotFound
    ├── tailwind.config.js
    ├── postcss.config.js
    └── vite.config.js
```

---

## Prerequisites

- **Python** ≥ 3.11
- **Node.js** ≥ 18 (LTS recommended)
- **MongoDB** running locally on port `27017` (or supply a remote URI)

---

## Installation

### 1 – Clone the repository

```bash
git clone https://github.com/AdityaBerad01/Team-Kurushtra.git
cd Team-Kurushtra
```

### 2 – Backend setup

```bash
cd backend

# Create and activate virtual environment
python -m venv venv

# Windows
venv\Scripts\activate

# macOS / Linux
source venv/bin/activate

# Install dependencies (includes flask-pymongo)
pip install flask-pymongo==2.3.0 -r requirements.txt

# Copy environment template and fill in your values
copy .env.example .env      # Windows
# cp .env.example .env      # macOS / Linux
```

Edit `backend/.env`:

```env
FLASK_ENV=development
FLASK_DEBUG=1
SECRET_KEY=change-me-to-a-long-random-string
JWT_SECRET_KEY=change-me-to-another-random-string
MONGO_URI=mongodb://localhost:27017/peerconnect
FRONTEND_ORIGIN=http://localhost:5173
```

### 3 – Frontend setup

```bash
cd ../frontend

# Copy environment template
copy .env.example .env      # Windows
# cp .env.example .env      # macOS / Linux

# Install dependencies
npm install
```

---

## Running the Application

### Start the Backend (Flask)

```bash
cd backend
venv\Scripts\activate        # Windows
# source venv/bin/activate   # macOS / Linux

flask --app run:app run --debug --port 5000
```

Backend available at: **http://localhost:5000**  
Health check: **http://localhost:5000/api/health**

### Start the Frontend (Vite)

```bash
cd frontend
npm run dev
```

Frontend available at: **http://localhost:5173**

---

## Running Tests

```bash
cd backend
venv\Scripts\activate        # Windows
pytest -v
```

---

## API Endpoints

| Method | Path        | Description          | Auth Required |
| ------ | ----------- | -------------------- | ------------- |
| GET    | /api/health | Service health check | No            |

---

## Environment Variables

### Backend (`backend/.env`)

| Variable          | Description               | Example                                 |
| ----------------- | ------------------------- | --------------------------------------- |
| `SECRET_KEY`      | Flask session secret key  | `super-secret-random-string`            |
| `JWT_SECRET_KEY`  | JWT signing key           | `another-random-string`                 |
| `MONGO_URI`       | MongoDB connection string | `mongodb://localhost:27017/peerconnect` |
| `FRONTEND_ORIGIN` | Allowed CORS origin       | `http://localhost:5173`                 |
| `FLASK_DEBUG`     | Enable debug mode (0/1)   | `1`                                     |

### Frontend (`frontend/.env`)

| Variable            | Description          | Example                     |
| ------------------- | -------------------- | --------------------------- |
| `VITE_API_BASE_URL` | Backend API base URL | `http://localhost:5000/api` |

---

## Contributing

1. Create a feature branch: `git checkout -b feature/your-feature`
2. Commit your changes: `git commit -m "feat: add your feature"`
3. Push and open a Pull Request.

---

_Built with ❤️ by Team Kurushtra for hackathon 2026._
