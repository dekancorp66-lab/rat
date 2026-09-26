import os
from urllib.parse import parse_qsl, urlencode, urlsplit, urlunsplit

from dotenv import load_dotenv

# Must run BEFORE importing auth (or anything else reading os.environ at
# import time), otherwise those modules raise KeyError even though .env
# exists on disk.
load_dotenv()


def normalize_database_url() -> None:
    """Remove pooler-only flags unsupported by the Prisma Python engine."""
    database_url = os.getenv("DATABASE_URL")
    if not database_url:
        return
    parts = urlsplit(database_url)
    query = [(key, value) for key, value in parse_qsl(parts.query) if key != "pgbouncer"]
    os.environ["DATABASE_URL"] = urlunsplit(
        (parts.scheme, parts.netloc, parts.path, urlencode(query), parts.fragment)
    )


normalize_database_url()

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from prisma import Prisma

from routers.auth_router import router as auth_router
from routers.chat_router import router as chat_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    db = Prisma()
    await db.connect()
    app.state.db = db
    yield
    await db.disconnect()


app = FastAPI(
    title="JengaAI API",
    description="AI-powered construction assistant for Tanzania — auth + Mazungumzo (chat) backend.",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS — the Vite dev server runs on :8080 (see frontend/vite.config.ts);
# add your deployed frontend origin via FRONTEND_URL in production.
frontend_url = os.getenv("FRONTEND_URL", "http://localhost:8080")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[frontend_url, "http://localhost:8080", "http://127.0.0.1:8080"],
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(chat_router)


@app.get("/health")
async def health():
    return {"status": "ok", "service": "JengaAI API", "region": "Tanzania"}
