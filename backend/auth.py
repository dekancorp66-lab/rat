"""JWT + password hashing helpers for JengaAI's own email/password auth.

Kept deliberately dependency-light: bcrypt for hashing, plain HS256 JWTs for
sessions. No third-party auth broker, no OAuth — this runs standalone against
our own Postgres `users` table.
"""

from datetime import datetime, timedelta, timezone
from typing import Optional
import os

from jose import JWTError, jwt
from passlib.context import CryptContext

SECRET_KEY = os.environ["JWT_SECRET_KEY"]
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "10080"))  # 7 days

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)


def create_access_token(user_id: str) -> str:
    expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    payload = {"sub": user_id, "exp": expire}
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


def decode_token(token: str) -> Optional[str]:
    """Return the user id encoded in `token`, or None if invalid/expired."""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload.get("sub")
    except JWTError:
        return None


def user_id_from_request(auth_header: str) -> Optional[str]:
    """Pull the Bearer token out of an `Authorization` header and decode it."""
    if not auth_header.startswith("Bearer "):
        return None
    return decode_token(auth_header.split(" ", 1)[1])
