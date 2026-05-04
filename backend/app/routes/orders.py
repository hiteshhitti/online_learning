from fastapi import APIRouter, HTTPException
from app.utils.sheets import get_sheet
from app.utils.helpers import enroll_user
from app.schemas.order import OrderCreate, DiscountValidate
import uuid
from datetime import datetime

router = APIRouter()


@router.post("/validate-discount")
def validate_discount(payload: DiscountValidate):
    """
    Validate a discount code against the 'discounts' sheet.
    Sheet columns: code | type (percent/flat) | value | max_uses | used | active | course_id (blank = all courses)
    Returns: { valid, discount_amount, final_amount, message }
    """
    try:
        sheet = get_sheet("discounts")
    except Exception:
        raise HTTPException(status_code=500, detail="Discount sheet not accessible")

    rows = sheet.get_all_records()
    code = payload.code.strip().upper()

    match = next((r for r in rows if str(r.get("code", "")).upper() == code), None)

    if not match:
        return {"valid": False, "message": "Invalid discount code", "discount_amount": 0, "final_amount": payload.original_amount}

    # Check active
    if str(match.get("active", "")).lower() not in ("true", "1", "yes"):
        return {"valid": False, "message": "This code is no longer active", "discount_amount": 0, "final_amount": payload.original_amount}

    # Check usage limit
    max_uses = int(match.get("max_uses", 0) or 0)
    used = int(match.get("used", 0) or 0)
    if max_uses > 0 and used >= max_uses:
        return {"valid": False, "message": "This code has reached its usage limit", "discount_amount": 0, "final_amount": payload.original_amount}

    # Check course restriction
    restricted_course = str(match.get("course_id", "")).strip()
    if restricted_course and restricted_course != str(payload.course_id):
        return {"valid": False, "message": "This code is not valid for this course", "discount_amount": 0, "final_amount": payload.original_amount}

    # Calculate discount
    discount_type = str(match.get("type", "percent")).lower()
    value = float(match.get("value", 0) or 0)
    original = payload.original_amount

    if discount_type == "percent":
        discount_amount = round(original * value / 100, 2)
    else:  # flat
        discount_amount = min(round(value, 2), original)

    final_amount = max(round(original - discount_amount, 2), 0)

    return {
        "valid": True,
        "message": f"Code applied! {int(value)}{'%' if discount_type == 'percent' else ' flat'} discount",
        "discount_amount": discount_amount,
        "final_amount": final_amount,
        "code": code,
    }


@router.post("/")
def create_order(order: OrderCreate):
    """Create a new order and enroll the user in the course."""
    sheet = get_sheet("orders")

    order_id = str(uuid.uuid4())

    # Increment usage count for discount code
    if order.discount_code:
        try:
            ds = get_sheet("discounts")
            rows = ds.get_all_records()
            for i, r in enumerate(rows, start=2):
                if str(r.get("code", "")).upper() == order.discount_code.upper():
                    current_used = int(r.get("used", 0) or 0)
                    ds.update_cell(i, 5, current_used + 1)  # column 5 = used
                    break
        except Exception as e:
            print(f"Could not update discount usage: {e}")

    # ── Increment seats_filled in batches sheet ────────────────────────────────
    if order.batch_id:
        try:
            bs = get_sheet("batches")
            batch_rows = bs.get_all_records()
            for i, r in enumerate(batch_rows, start=2):
                if str(r.get("id")) == str(order.batch_id):
                    current_filled = int(r.get("seats_filled", 0) or 0)
                    bs.update_cell(i, 7, current_filled + 1)  # column 7 = seats_filled
                    break
        except Exception as e:
            print(f"Could not update batch seats_filled: {e}")
    # ── End batch hook ────────────────────────────────────────────────────────

    # Orders sheet columns:
    # order_id | user_id | course_id | amount | discount_code |
    # discount_amount | reference | batch_id | status | created_at
    sheet.append_row([
        order_id,
        order.user_id,
        order.course_id,
        order.amount,
        order.discount_code or "",
        order.discount_amount or 0,
        order.reference or "",
        order.batch_id or "",
        "pending",          # ← pending until you manually verify payment
        str(datetime.now()),
    ])

    # NOTE: Enrollment is NOT automatic anymore.
    # After you verify the student's UPI payment (WhatsApp screenshot),
    # use PATCH /admin/orders/{order_id}/activate to enroll them.

    # ── Referral commission hook ───────────────────────────────────────────────
    if order.discount_code:
        try:
            code = order.discount_code.strip().upper()
            discounts = get_sheet("discounts").get_all_records()
            matched_discount = next(
                (d for d in discounts if str(d.get("code", "")).upper() == code), None
            )
            if matched_discount and matched_discount.get("member_id"):
                members = get_sheet("members").get_all_records()
                member = next(
                    (m for m in members
                     if str(m.get("id")) == str(matched_discount["member_id"])),
                    None,
                )
                if member and str(member.get("active", "true")).lower() == "true":
                    rate = float(member.get("commission_rate", 0) or 0)
                    earned = round(order.amount * rate / 100, 2)
                    get_sheet("member_referrals").append_row([
                        str(uuid.uuid4()),
                        str(member["id"]),
                        order_id,
                        order.user_id,
                        order.course_id,
                        code,
                        order.amount,
                        rate,
                        earned,
                        "pending",
                        str(datetime.now()),
                    ])
        except Exception as e:
            print(f"Commission recording error: {e}")
    # ── End referral hook ─────────────────────────────────────────────────────

    return {"msg": "Order created successfully", "order_id": order_id}


@router.get("/user/{user_id}")
def get_user_orders(user_id: str):
    """Get all orders for a specific user."""
    sheet = get_sheet("orders")
    all_orders = sheet.get_all_records()
    return [o for o in all_orders if str(o.get("user_id")) == str(user_id)]
