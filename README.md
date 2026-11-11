# JengaAI

AI construction assistant for Tanzania — combined project.

- **frontend/** — the original JengaAI app (TanStack Start/React), 100%
  unchanged in design and every existing feature (Mazungumzo, Mshauri,
  Ramani, Gharama, Vifaa, Site Engineer, Interior, Mradi, Sheria, Agiza,
  Wataalamu), plus:
  - Real email/password **login** (`/login`) and **signup** (`/register`)
    pages, styled 100% in JengaAI's own design system (Fraunces/Plus Jakarta
    Sans, `--color-primary`, existing `Logo`/`Button`/`Input` components) —
    not the visual style of any other project.
  - The whole `/anza` app is now gated behind a real session; signed-out
    visitors are redirected to `/login`.
  - A user chip + sign-out button in the app header.
  - **Mazungumzo** (the chat feature at `/anza`) now talks to a real backend
    endpoint, `POST /api/chat`, and saves each logged-in user's history.

- **jenga_ai_engine/** — the complete machine-learning workspace. The ML
  developer should continue working here, especially in `engine/`, `models/`,
  `data/`, and `tests/`. This folder is connected directly to Mazungumzo.
- **backend/** — new **FastAPI** service
  reference in `frontend/src/lib/ai.ts`):
  - `POST /auth/register`, `POST /auth/login`, `GET /auth/me` — JWT auth,
    bcrypt password hashing, backed by a real **Postgres** database via
    Prisma (`backend/prisma/schema.prisma`).
  - `POST /api/chat` — the Mazungumzo endpoint, powered by
    `jenga_ai_engine/engine/orchestrator.py` and the Gemini model configured in
    `jenga_ai_engine/config.py`.
  - `GET /api/chat/conversations` and `GET /api/chat/conversations/{id}` —
    a logged-in user's saved conversations.
  - Requires your own Postgres and Gemini credentials; secrets are not shipped
    in the repository. See `backend/.env.example`.

## Running it locally

**Start both services on Windows (PowerShell):**

```powershell
.\start-dev.ps1
```

This opens the frontend on `http://localhost:8080` and the backend on
`http://localhost:8000`. The frontend uses `frontend/.env` to send auth and
chat requests to the backend.

**Backend (port 8000):**

```bash
cd backend
cp .env.example .env
# Fill in DATABASE_URL, DIRECT_URL, JWT_SECRET_KEY and GEMINI_API_KEY.
bash start.sh
```

**Frontend (port 8080):**

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

Open http://localhost:8080 — you'll land on the existing marketing page,
`/anza` will send you to `/login` if you're signed out, and `/register`
creates a real account in Postgres and drops you straight into Mazungumzo.

`frontend/.env` already points `BACKEND_URL` / `VITE_BACKEND_URL` at
`http://127.0.0.1:8000`; create it from `frontend/.env.example` for local
development. Production uses `https://jenga-ai.onrender.com`.

## Deploying with Vercel + Render

1. Create a Render Blueprint from this repository. `render.yaml` sets the
  service root to `backend/`; it installs `requirements.txt`, generates the
  Prisma client, deploys committed migrations before starting Uvicorn, and checks
  `/health`. The backend refuses to start if `users`, `conversations`, or
  `messages` is still missing.
2. Set Render's `DATABASE_URL` to Neon's pooled URL and `DIRECT_URL` to Neon's
  direct URL (both with SSL enabled). Set `JWT_SECRET_KEY` to a newly generated
  secret and `GEMINI_API_KEY` to your own Gemini key. Do not commit these values.
  The Blueprint allows the two currently live JengaAI Vercel origins listed in
  `FRONTEND_URL`; replace them if your Vercel project uses different domains.
3. Create a Vercel project with the root directory set to `frontend`.
  `frontend/vercel.json` uses `npm ci` and `npm run build`.
4. Add `BACKEND_URL` and `VITE_BACKEND_URL` in Vercel, both set to the public
  Render API URL `https://jenga-ai.onrender.com`. These are public endpoint
  URLs, not secrets. Do not put database, JWT, or Gemini credentials in any
  `VITE_` variable. If `/anza/design` should work in production, also set
  `VITE_DESIGN_STUDIO_URL` to the separately deployed Design Studio URL; the
  local example points at `localhost:8082` and is not usable from Vercel.
5. After changing the database schema, deploy and confirm Render logs show
  Prisma schema synchronization before Uvicorn starts. Verify
  `https://jenga-ai.onrender.com/health` returns `status: ok` and
  `database: connected`.

The deployment uses `prisma migrate deploy` so the checked-in migrations create
the missing tables and backfill existing messages into conversations without
resetting the database. If Neon already contains tables but has no matching
`_prisma_migrations` history, stop and inspect/baseline that database before
deployment; do not reset it or mark migrations applied without verifying its
schema and data.
