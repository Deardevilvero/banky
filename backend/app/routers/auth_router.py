from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.auth import create_access_token, get_current_user, hash_password, verify_password
from app.database import get_db
from app.models import User
from app.schemas import (
    AuthResponse,
    LoginRequest,
    ProfileUpdate,
    RegisterRequest,
    UserOut,
    user_to_out,
)

router = APIRouter(prefix="/auth", tags=["auth"])


@router.get("/me")
def me(user: User = Depends(get_current_user)) -> dict:
    return {"user": user_to_out(user)}


@router.post("/login", response_model=AuthResponse)
def login(body: LoginRequest, db: Session = Depends(get_db)) -> AuthResponse:
    user = db.query(User).filter(User.email == body.email.lower()).first()
    if user is None or not verify_password(body.password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")
    token = create_access_token(user.id)
    return AuthResponse(user=user_to_out(user), token=token)


@router.post("/register", response_model=AuthResponse)
def register(body: RegisterRequest, db: Session = Depends(get_db)) -> AuthResponse:
    email = body.email.lower()
    if db.query(User).filter(User.email == email).first():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already registered")
    user = User(
        name=body.name.strip(),
        email=email,
        password_hash=hash_password(body.password),
        avatar=body.name.strip()[0].upper() if body.name.strip() else "U",
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    token = create_access_token(user.id)
    return AuthResponse(user=user_to_out(user), token=token)


@router.put("/profile")
def update_profile(
    body: ProfileUpdate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> dict:
    if body.name is not None:
        user.name = body.name.strip()
        user.avatar = user.name[0].upper() if user.name else "U"
    if body.morningMotivation is not None:
        user.morning_motivation = body.morningMotivation
    if body.monthlyBudget is not None:
        user.monthly_budget = body.monthlyBudget
    db.commit()
    db.refresh(user)
    return {"user": user_to_out(user)}
