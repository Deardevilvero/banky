# AI Finance Tracker — Backend

Python **FastAPI** API + **SQLite** database + **AI brain** (`ai_features.py`).

Pairs with the React frontend at `../`. All routes match what the UI expects under `/api`.

## Quick start

```bash
cd backend
python -m venv .venv

# Windows
.venv\Scripts\activate

# macOS / Linux
# source .venv/bin/activate

pip install -r requirements.txt
copy .env.example .env    # Windows
# cp .env.example .env    # macOS / Linux

python run.py
```

API runs at **http://localhost:5000/api** (matches `VITE_API_URL` in the frontend `.env`).

Interactive docs: **http://localhost:5000/docs**

## Demo account

On first launch the database is seeded with sample data:

| Field    | Value              |
|----------|--------------------|
| Email    | `alex@example.com` |
| Password | `demo1234`         |

Register a new account anytime via the UI — data is stored in `finance_tracker.db`.

## AI features

Set `ANTHROPIC_API_KEY` in `.env` to enable Claude-powered:

- Weekly spending reports
- Budget suggestions
- Recovery plans
- Finance chat
- Morning motivation
- Natural-language transaction parsing

Without a key, the same endpoints work using **rule-based fallbacks** so you can develop without an API key.

## API routes

| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/auth/login` | Login |
| POST | `/api/auth/register` | Register |
| GET | `/api/auth/me` | Current user |
| PUT | `/api/auth/profile` | Update profile / budget |
| GET/POST | `/api/transactions` | List / create |
| PUT/DELETE | `/api/transactions/:id` | Update / delete |
| GET | `/api/transactions/today` | Today's transactions |
| GET | `/api/transactions/heatmap` | 90-day spend heatmap |
| GET | `/api/transactions/summary` | Income / expense summary |
| GET | `/api/transactions/stats` | Per-category stats |
| POST | `/api/ai/weekly-report` | AI weekly report |
| POST | `/api/ai/suggest-budgets` | AI budget suggestions |
| POST | `/api/ai/recovery-plan` | Overspend recovery coach |
| POST | `/api/ai/chat` | Finance Q&A |
| GET | `/api/ai/morning` | Morning tip |
| POST | `/api/ai/parse-transaction` | Parse natural-language entry |

## Project layout

```
backend/
├── run.py                 # python run.py — start server
├── requirements.txt
├── .env.example
├── finance_tracker.db     # SQLite (created on first run)
└── app/
    ├── main.py            # FastAPI app
    ├── config.py          # Settings from .env
    ├── database.py        # SQLAlchemy + SQLite
    ├── models.py          # User, Transaction tables
    ├── schemas.py         # Request/response shapes
    ├── auth.py            # JWT + password hashing
    ├── ai_features.py     # AI brain (Claude + fallbacks)
    ├── services.py        # Transaction analytics
    ├── seed.py            # Demo data
    └── routers/
        ├── auth_router.py
        ├── transactions_router.py
        └── ai_router.py
```

## Run frontend + backend together

**Terminal 1 — backend:**
```bash
cd backend && python run.py
```

**Terminal 2 — frontend:**
```bash
npm run dev
```

Open http://localhost:5173 and log in with the demo account or register.

## Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `5000` | Server port |
| `DATABASE_URL` | `sqlite:///./finance_tracker.db` | Database connection |
| `SECRET_KEY` | (dev default) | JWT signing key — change in production |
| `ANTHROPIC_API_KEY` | (empty) | Claude API key for real AI |
| `CORS_ORIGINS` | `http://localhost:5173` | Allowed frontend origins |
