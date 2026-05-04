from fastapi import APIRouter, HTTPException
from app.utils.sheets import get_sheet
from app.utils.auth import create_token, hash_password, verify_password
from app.schemas.user import UserCreate, UserOut, UserUpdate
from app.schemas.auth import LoginRequest, TokenResponse
import uuid
from datetime import datetime

router = APIRouter()


@router.get("/")
def get_users():
    """List all users (admin use)."""
    sheet = get_sheet("users")
    return sheet.get_all_records()


@router.post("/register")
def register(user: UserCreate):
    """Register a new user."""
    sheet = get_sheet("users")
    users = sheet.get_all_records()

    # Email duplicate check
    for u in users:
        if u.get("email") == user.email:
            raise HTTPException(status_code=400, detail="Email already registered")

    user_id = str(uuid.uuid4())
    hashed_pw = hash_password(user.password)

    sheet.append_row([
        user_id,
        user.name,
        user.email,
        hashed_pw,
        str(datetime.now()),
        user.bio or "",
        user.location or "",
        user.phone or "",
        user.website or "",
    ])

    return {"msg": "User created successfully"}


@router.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest):
    """Login and get a JWT token."""
    sheet = get_sheet("users")
    users = sheet.get_all_records()

    user = next((u for u in users if u.get("email") == payload.email), None)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid email or password")

    if not verify_password(payload.password, user.get("password", "")):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    token_data = {"id": user["id"], "email": user["email"], "name": user["name"]}
    token = create_token(token_data)

    return TokenResponse(
        access_token=token,
        token_type="bearer",
        user={"id": user["id"], "name": user["name"], "email": user["email"]},
    )


@router.get("/me")
def get_me(user_id: str):
    """Get current user's profile. Pass user_id as query param (use Authorization header in production)."""
    sheet = get_sheet("users")
    users = sheet.get_all_records()
    user = next((u for u in users if u.get("id") == user_id), None)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    # Never return password
    return {k: v for k, v in user.items() if k != "password"}


@router.patch("/me")
def update_me(user_id: str, payload: UserUpdate):
    """Update profile fields."""
    sheet = get_sheet("users")
    users = sheet.get_all_records()

    for i, u in enumerate(users, start=2):  # start=2 because row 1 is header
        if u.get("id") == user_id:
            if payload.name is not None:
                sheet.update_cell(i, 2, payload.name)
            if payload.bio is not None:
                sheet.update_cell(i, 6, payload.bio)
            if payload.location is not None:
                sheet.update_cell(i, 7, payload.location)
            if payload.phone is not None:
                sheet.update_cell(i, 8, payload.phone)
            if payload.website is not None:
                sheet.update_cell(i, 9, payload.website)
            return {"msg": "Profile updated"}

    raise HTTPException(status_code=404, detail="User not found")


@router.get("/{user_id}/enrollments")
def get_enrollments(user_id: str):
    """Get all enrollments for a user."""
    sheet = get_sheet("enrollments")
    all_rows = sheet.get_all_records()
    enrollments = [
        {"course_id": r["course_id"], "progress": r.get("progress", 0), "enrolled_at": r.get("enrolled_at", "")}
        for r in all_rows
        if r.get("user_id") == user_id
    ]
    return enrollments


from pydantic import BaseModel

class ChangePasswordPayload(BaseModel):
    user_id: str
    current_password: str
    new_password: str

class DeleteAccountPayload(BaseModel):
    user_id: str

@router.post("/change-password")
def change_password(payload: ChangePasswordPayload):
    """Change user password."""
    sheet = get_sheet("users")
    users = sheet.get_all_records()

    for i, u in enumerate(users, start=2):
        if u.get("id") == payload.user_id:
            if not verify_password(payload.current_password, u.get("password", "")):
                raise HTTPException(status_code=400, detail="Current password is incorrect")
            sheet.update_cell(i, 4, hash_password(payload.new_password))
            return {"msg": "Password changed successfully"}

    raise HTTPException(status_code=404, detail="User not found")


@router.delete("/me")
def delete_account(user_id: str):
    """Delete user account."""
    sheet = get_sheet("users")
    users = sheet.get_all_records()

    for i, u in enumerate(users, start=2):
        if u.get("id") == user_id:
            sheet.delete_rows(i)
            return {"msg": "Account deleted"}

    raise HTTPException(status_code=404, detail="User not found")
