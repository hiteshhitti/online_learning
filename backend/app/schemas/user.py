from pydantic import BaseModel, EmailStr
from typing import Optional


class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str
    bio: Optional[str] = ""
    location: Optional[str] = ""
    phone: Optional[str] = ""
    website: Optional[str] = ""


class UserOut(BaseModel):
    id: str
    name: str
    email: EmailStr

    class Config:
        from_attributes = True


class UserUpdate(BaseModel):
    name: Optional[str] = None
    bio: Optional[str] = None
    location: Optional[str] = None
    phone: Optional[str] = None
    website: Optional[str] = None
