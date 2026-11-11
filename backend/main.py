import os
from contextlib import asynccontextmanager

from dotenv import load_dotenv

load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from prisma import Prisma


def get_allowed_origins() -> list[str]:
    configured = os.getenv("FRONTEND_URL", "")
    origins: list[str] = []

    for raw_origin in configured.split(","):
        origin = raw_origin.strip().rstrip("/")
        if origin and origin not in origins:
            origins.append(origin)

    defaults = [
        "http://localhost:8080",
        "http://127.0.0.1:8080",
        "http://0.0.0.0:8080",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ]
    for origin in defaults:
        if origin not in origins:
            origins.append(origin)

    return origins


from routers.auth_router import router as auth_router
from routers.chat_router import router as chat_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    db = Prisma()
    connected = False
    try:
        await db.connect()
        connected = True
        tables = await db.query_raw(
            """
            SELECT
                to_regclass('public.users') IS NOT NULL AS users,
                to_regclass('public.conversations') IS NOT NULL AS conversations,
                to_regclass('public.messages') IS NOT NULL AS messages
            """
        )
        table_status = tables[0] if tables else {}
        required_tables = ("users", "conversations", "messages")
        missing_tables = [
            name for name in required_tables if not table_status.get(name, False)
        ]
        if missing_tables:
            raise RuntimeError(
                "Database schema is not ready; missing public tables: "
                + ", ".join(missing_tables)
            )
        app.state.db = db
        yield
    finally:
        if connected:
            await db.disconnect()


app = FastAPI(
    title="JengaAI API",
    description="AI-powered construction assistant for Tanzania",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=get_allowed_origins(),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
    max_age=600,
)

app.include_router(auth_router)
app.include_router(chat_router)


@app.get("/")
async def root():
    return {
        "message": "Welcome to JengaAI API",
        "status": "running",
        "docs": "/docs",
        "health": "/health",
    }


@app.get("/health")
async def health():
    return {
        "status": "ok",
        "service": "JengaAI API",
        "region": "Tanzania",
        "database": "connected",
    }
