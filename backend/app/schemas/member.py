from pydantic import BaseModel, EmailStr
from typing import Optional


class MemberCreate(BaseModel):
    name: str
    email: EmailStr
    password: str
    commission_rate: float = 20.0
    coupon_code: str


class MemberLogin(BaseModel):
    email: str
    password: str


class MemberUpdate(BaseModel):
    commission_rate: Optional[float] = None
    active: Optional[bool] = None


class PayoutCreate(BaseModel):
    amount: float
    payment_method: Optional[str] = ""
    notes: Optional[str] = ""
