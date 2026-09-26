from fastapi import APIRouter, HTTPException, Request, status
from prisma import Prisma

from auth import create_access_token, hash_password, user_id_from_request, verify_password
from schemas import TokenResponse, UserLogin, UserOut, UserRegister

router = APIRouter(prefix="/auth", tags=["auth"])


def get_db(request: Request) -> Prisma:
    return request.app.state.db


def _to_user_out(user) -> UserOut:
    return UserOut(
        id=user.id,
        full_name=user.full_name,
        email=user.email,
        phone=user.phone,
        is_premium=user.is_premium,
    )


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def register(data: UserRegister, request: Request):
    db = get_db(request)

    existing = await db.user.find_unique(where={"email": data.email})
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Barua pepe hii tayari imesajiliwa. Tafadhali ingia au tumia barua pepe nyingine.",
        )

    user = await db.user.create(
        data={
            "full_name": data.full_name,
            "email": data.email,
            "phone": data.phone,
            "password": hash_password(data.password),
        }
    )

    token = create_access_token(user.id)
    return TokenResponse(access_token=token, user=_to_user_out(user))


@router.post("/login", response_model=TokenResponse)
async def login(data: UserLogin, request: Request):
    db = get_db(request)

    user = await db.user.find_unique(where={"email": data.email})
    if not user or not verify_password(data.password, user.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Barua pepe au nywila si sahihi.",
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Akaunti yako imezuiwa. Wasiliana na msaada.",
        )

    token = create_access_token(user.id)
    return TokenResponse(access_token=token, user=_to_user_out(user))


@router.get("/me", response_model=UserOut)
async def get_me(request: Request):
    db = get_db(request)

    # /auth isn't behind the global auth middleware (login/register live here
    # too and must stay open), so decode the token directly.
    user_id = user_id_from_request(request.headers.get("Authorization", ""))
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token si sahihi au imeisha muda wake",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user = await db.user.find_unique(where={"id": user_id})
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Mtumiaji hapatikani")
    return _to_user_out(user)
