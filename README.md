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
  - `GET /api/chat/history` — a logged-in user's saved conversation.
  - Ships with working Postgres + Gemini credentials in `backend/.env`
    (carried over from your existing Supabase project) so it runs out of the
    box — see `backend/.env.example` to point it at your own instead.

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
bash start.sh

  pip install -r requirements.txt
  prisma generate
  prisma db push
   uvicorn main:app --reload --port 8000
```

**Frontend (port 8080):**

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:8080 — you'll land on the existing marketing page,
`/anza` will send you to `/login` if you're signed out, and `/register`
creates a real account in Postgres and drops you straight into Mazungumzo.

`frontend/.env` already points `BACKEND_URL` / `VITE_BACKEND_URL` at
`http://127.0.0.1:8000`; change both if you deploy the backend elsewhere.

## Deploying with Vercel + Render

1. Create a Render Blueprint from this repository. `render.yaml` deploys the
  FastAPI backend and uses `DIRECT_URL` to synchronize the Prisma schema.
2. Add these Render secrets: `DATABASE_URL`, `DIRECT_URL`, `JWT_SECRET_KEY`,
  `GEMINI_API_KEY`, and `FRONTEND_URL`. Use your deployed Vercel URL for
  `FRONTEND_URL`.
3. Create a Vercel project with the root directory set to `frontend`.
  `frontend/vercel.json` uses `npm ci` and `npm run build`.
4. Add `BACKEND_URL` and `VITE_BACKEND_URL` in Vercel, both set to the public
  Render API URL, for example `https://jenga-ai-api.onrender.com`.
5. After Vercel provides its URL, update Render's `FRONTEND_URL` to that exact
  origin and redeploy the backend.

Use a direct Postgres connection for `DIRECT_URL` (port 5432 where your
provider supports it) and a pooled connection for `DATABASE_URL`.
