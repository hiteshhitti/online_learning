from pydantic import BaseModel
from typing import Optional


class OrderCreate(BaseModel):
    user_id: str
    course_id: str
    amount: float
    discount_code: Optional[str] = None
    discount_amount: Optional[float] = 0.0
    reference: Optional[str] = None
    batch_id: Optional[str] = None      # ← new field


class OrderOut(BaseModel):
    id: str
    user_id: str
    course_id: str
    amount: float
    status: str

    class Config:
        from_attributes = True


class DiscountValidate(BaseModel):
    code: str
    course_id: str
    original_amount: float
