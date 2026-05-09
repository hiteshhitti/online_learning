from pydantic import BaseModel, EmailStr
from typing import Optional


class MemberCreate(BaseModel):
    name: str
    email: EmailStr
    password: str
    commission_rate: float = 20.0          # % this member earns on their own coupon sales
    coupon_code: str
    discount_rate: Optional[float] = None          # % students get off; defaults to commission_rate if omitted
    referred_by_member_id: Optional[str] = None    # if set, this member was recruited by another member
    parent_commission_rate: Optional[float] = None # % the recruiting parent earns when THIS member makes a sale


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
