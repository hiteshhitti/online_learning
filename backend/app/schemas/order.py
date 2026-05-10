from pydantic import BaseModel
from typing import Optional


class OrderCreate(BaseModel):
    user_id: str
    course_id: str
    amount: float
    full_amount: Optional[float] = None
    payment_type: Optional[str] = 'full'
    discount_code: Optional[str] = None
    discount_amount: Optional[float] = 0.0
    reference: Optional[str] = None
    batch_id: Optional[str] = None


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


# ── Razorpay ──────────────────────────────────────────────────────────────────

class RazorpayOrderRequest(BaseModel):
    """POST /orders/razorpay/create-order"""
    amount: float                            # INR (e.g. 4999.0)
    internal_order_id: Optional[str] = None  # your DB order id


class RazorpayVerifyRequest(BaseModel):
    """POST /orders/razorpay/verify-payment"""
    razorpay_order_id:   str
    razorpay_payment_id: str
    razorpay_signature:  str
    internal_order_id:   str
    user_id:             str
    course_id:           str
