"""
Razorpay payment utility.
Credentials are read from backend/.env via python-dotenv.
"""
import os, hmac, hashlib, warnings
from dotenv import load_dotenv

load_dotenv()

KEY_ID     = os.getenv("RAZORPAY_KEY_ID", "")
KEY_SECRET = os.getenv("RAZORPAY_KEY_SECRET", "")

if not KEY_ID or not KEY_SECRET:
    warnings.warn(
        "RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET not set in backend/.env. "
        "Payment endpoints will fail at runtime.",
        stacklevel=2,
    )

try:
    import razorpay
    client = razorpay.Client(auth=(KEY_ID, KEY_SECRET)) if KEY_ID and KEY_SECRET else None
except ImportError:
    razorpay = None
    client   = None
    warnings.warn("razorpay package not installed. Run: pip install razorpay", stacklevel=2)


def create_razorpay_order(amount_inr: float, receipt: str) -> dict:
    """
    Create a Razorpay order.
    amount_inr  — amount in rupees (e.g. 4999.0)
    receipt     — your internal order/receipt id
    """
    if client is None:
        raise RuntimeError("Razorpay not configured. Check backend/.env and pip install razorpay")

    amount_paise = int(round(amount_inr * 100))
    if amount_paise < 100:
        raise ValueError(f"Amount must be at least ₹1 (100 paise). Got {amount_paise} paise.")

    return client.order.create({
        "amount":          amount_paise,
        "currency":        "INR",
        "receipt":         receipt,
        "payment_capture": 1,
    })


def verify_razorpay_signature(
    razorpay_order_id: str,
    razorpay_payment_id: str,
    razorpay_signature: str,
) -> bool:
    """HMAC-SHA256 verification per Razorpay docs."""
    if not KEY_SECRET:
        raise RuntimeError("RAZORPAY_KEY_SECRET not configured")

    message  = f"{razorpay_order_id}|{razorpay_payment_id}"
    expected = hmac.new(
        KEY_SECRET.encode("utf-8"),
        message.encode("utf-8"),
        hashlib.sha256,
    ).hexdigest()
    return hmac.compare_digest(expected, razorpay_signature)
