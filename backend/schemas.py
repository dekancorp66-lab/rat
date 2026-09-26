import re
from typing import Literal, Optional

from pydantic import BaseModel, EmailStr, field_validator


class UserRegister(BaseModel):
    full_name: str
    email: EmailStr
    phone: str
    password: str

    @field_validator("full_name")
    @classmethod
    def name_not_empty(cls, v: str) -> str:
        if len(v.strip()) < 2:
            raise ValueError("Jina lazima liwe na herufi 2 au zaidi")
        return v.strip()

    @field_validator("password")
    @classmethod
    def password_strength(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("Nywila lazima iwe na herufi 8 au zaidi")
        return v

    @field_validator("phone")
    @classmethod
    def phone_format(cls, v: str) -> str:
        digits = re.sub(r"\D", "", v)
        if len(digits) < 9:
            raise ValueError("Namba ya simu si sahihi")
        return v


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserOut(BaseModel):
    id: str
    full_name: str
    email: str
    phone: str
    is_premium: bool

    model_config = {"from_attributes": True}


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut


class ChatMessage(BaseModel):
    role: Literal["user", "assistant"]
    content: str


class ChatRequest(BaseModel):
    messages: list[ChatMessage]
    conversation_id: Optional[str] = None


class ConversationCreate(BaseModel):
    title: str = "New conversation"


class ChatOk(BaseModel):
    ok: Literal[True] = True
    text: str
    conversation_id: str


class ChatErr(BaseModel):
    ok: Literal[False] = False
    error: str
