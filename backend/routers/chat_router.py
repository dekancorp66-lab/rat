import sys
import uuid
from pathlib import Path

from fastapi import APIRouter, HTTPException, Request

ENGINE_ROOT = Path(__file__).resolve().parents[2] / "jenga_ai_engine"
if str(ENGINE_ROOT) not in sys.path:
    sys.path.insert(0, str(ENGINE_ROOT))

from engine.orchestrator import JengaAIOrchestrator
from auth import user_id_from_request
from schemas import ChatErr, ChatOk, ChatRequest, ConversationCreate

router = APIRouter(tags=["chat"])


def require_user(request: Request) -> str:
    user_id = user_id_from_request(request.headers.get("Authorization", ""))
    if not user_id:
        raise HTTPException(status_code=401, detail="Authentication required")
    return user_id


@router.get("/api/chat/conversations")
async def list_conversations(request: Request):
    user_id = require_user(request)
    conversations = await request.app.state.db.query_raw(
        'SELECT id, title, created_at, updated_at FROM conversations WHERE user_id = $1 ORDER BY updated_at DESC LIMIT 100',
        user_id,
    )
    return conversations


@router.post("/api/chat/conversations", status_code=201)
async def create_conversation(body: ConversationCreate, request: Request):
    user_id = require_user(request)
    title = body.title.strip()[:120] or "New conversation"
    rows = await request.app.state.db.query_raw(
        'INSERT INTO conversations (id, user_id, title, created_at, updated_at) VALUES ($1, $2, $3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP) RETURNING id, title, created_at, updated_at',
        str(uuid.uuid4()),
        user_id,
        title,
    )
    return rows[0]


@router.get("/api/chat/conversations/{conversation_id}")
async def get_conversation(conversation_id: str, request: Request):
    user_id = require_user(request)
    conversation_rows = await request.app.state.db.query_raw(
        'SELECT id, title FROM conversations WHERE id = $1 AND user_id = $2', conversation_id, user_id
    )
    if not conversation_rows:
        raise HTTPException(status_code=404, detail="Conversation not found")
    messages = await request.app.state.db.query_raw(
        'SELECT id, role, content, created_at FROM messages WHERE conversation_id = $1 AND user_id = $2 ORDER BY created_at ASC LIMIT 200',
        conversation_id,
        user_id,
    )
    return {"id": conversation_rows[0]["id"], "title": conversation_rows[0]["title"], "messages": messages}


@router.post("/api/chat")
async def send_message(body: ChatRequest, request: Request):
    """Matches the contract `src/lib/ai.ts` (askJenga) expects: always HTTP
    200, `{ok: true, text}` on success or `{ok: false, error}` on failure —
    the frontend falls back to its local calculator either way."""
    if not body.messages:
        return ChatErr(error="Hakuna ujumbe uliotumwa.")

    user_id = require_user(request)
    conversation_rows = await request.app.state.db.query_raw(
        'SELECT id FROM conversations WHERE id = $1 AND user_id = $2', body.conversation_id, user_id
    ) if body.conversation_id else []
    if conversation_rows:
        conversation_id = conversation_rows[0]["id"]
    else:
        created = await request.app.state.db.query_raw(
            'INSERT INTO conversations (id, user_id, title, created_at, updated_at) VALUES ($1, $2, $3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP) RETURNING id',
            str(uuid.uuid4()),
            user_id,
            body.messages[-1].content[:120],
        )
        conversation_id = created[0]["id"]

    *history_msgs, latest = body.messages
    orchestrator = JengaAIOrchestrator()
    orchestrator.load_history(
        [{"role": message.role, "content": message.content} for message in history_msgs]
    )

    await request.app.state.db.execute_raw(
        'INSERT INTO messages (id, user_id, conversation_id, role, content, created_at) VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)',
        str(uuid.uuid4()), user_id, conversation_id, "user", latest.content
    )

    try:
        result = orchestrator.process_message(latest.content)
        ai_text = result["response"]
    except Exception as exc:  # Gemini quota/network/etc — surface, don't 500
        return ChatErr(error=f"Hitilafu ya AI: {exc}")

    await request.app.state.db.execute_raw(
        'INSERT INTO messages (id, user_id, conversation_id, role, content, created_at) VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)',
        str(uuid.uuid4()), user_id, conversation_id, "assistant", ai_text
    )
    await request.app.state.db.execute_raw('UPDATE conversations SET updated_at = CURRENT_TIMESTAMP WHERE id = $1', conversation_id)
    return ChatOk(text=ai_text, conversation_id=conversation_id)
