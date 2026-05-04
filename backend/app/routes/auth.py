from fastapi import APIRouter
from app.database import SessionLocal
from app.models.user import User

router = APIRouter()

@router.post("/register")
def register(user: dict):
    db = SessionLocal()
    new_user = User(**user)
    db.add(new_user)
    db.commit()
    return {"msg": "User created"}