from fastapi import APIRouter, HTTPException
from app.utils.sheets import get_sheet
from app.utils.helpers import enroll_user
from app.utils.payment import create_razorpay_order, verify_razorpay_signature, KEY_ID
from app.schemas.order import OrderCreate, DiscountValidate, RazorpayOrderRequest, RazorpayVerifyRequest
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
    # id | user_id | course_id | amount | full_amount | payment_type |
    # discount_code | discount_amount | referance | batch_id | status | created_id
    payment_type = getattr(order, 'payment_type', 'full') or 'full'
    full_amount  = getattr(order, 'full_amount', None) or order.amount

    sheet.append_row([
        order_id,               # id
        order.user_id,          # user_id
        order.course_id,        # course_id
        order.amount,           # amount (paid now)
        full_amount,            # full_amount (total course price)
        payment_type,           # payment_type: 'full' or 'part'
        order.discount_code or "",   # discount_code
        order.discount_amount or 0,  # discount_amount
        order.reference or "",       # referance
        order.batch_id or "",        # batch_id
        "pending",                   # status
        str(datetime.now()),         # created_id
    ])

    # NOTE: Enrollment is NOT automatic anymore.
    # After you verify the student's UPI payment (WhatsApp screenshot),
    # use PATCH /admin/orders/{order_id}/activate to enroll them.

    # ── Referral commission hook (2-tier) ────────────────────────────────────
    if order.discount_code:
        try:
            code = order.discount_code.strip().upper()

            # Find the child member who owns this coupon code
            members = get_sheet("members").get_all_records()
            child_member = next(
                (m for m in members if str(m.get("coupon_code", "")).upper() == code),
                None,
            )

            # Legacy: also check discounts sheet for member_id link
            if not child_member:
                discounts = get_sheet("discounts").get_all_records()
                matched_discount = next(
                    (d for d in discounts if str(d.get("code", "")).upper() == code), None
                )
                if matched_discount and matched_discount.get("member_id"):
                    child_member = next(
                        (m for m in members
                         if str(m.get("id")) == str(matched_discount["member_id"])),
                        None,
                    )

            if child_member and str(child_member.get("active", "true")).lower() == "true":
                ref_sheet = get_sheet("member_referrals")

                # Check if this child member was referred by a parent member (2-tier)
                parent_member_id = str(child_member.get("referred_by_member_id", "")).strip()
                parent_member = next(
                    (m for m in members if str(m.get("id")) == parent_member_id),
                    None,
                ) if parent_member_id else None

                if parent_member and str(parent_member.get("active", "true")).lower() == "true":
                    # ── 2-tier split: rates set by admin at member creation ────
                    # child_member's commission_rate = what child earns on their own sales
                    # child_member's parent_commission_rate = what parent earns on child's sales
                    child_rate  = float(child_member.get("commission_rate", 0) or 0)
                    parent_rate = float(child_member.get("parent_commission_rate", 0) or 0)

                    child_earned  = round(order.amount * child_rate / 100, 2)
                    parent_earned = round(order.amount * parent_rate / 100, 2)

                    # Child commission row
                    ref_sheet.append_row([
                        str(uuid.uuid4()),          # id
                        str(child_member["id"]),    # member_id
                        order_id,                   # order_id
                        order.user_id,              # student_id
                        order.course_id,            # course_id
                        code,                       # coupon_code
                        order.amount,               # order_amount
                        child_rate,                 # commission_rate
                        child_earned,               # commission_earned
                        "pending",                  # payout_status
                        str(datetime.now()),        # created_at
                    ])

                    # Parent bonus commission row (same coupon code, different member)
                    ref_sheet.append_row([
                        str(uuid.uuid4()),          # id
                        str(parent_member["id"]),   # member_id
                        order_id,                   # order_id
                        order.user_id,              # student_id
                        order.course_id,            # course_id
                        code,                       # coupon_code (child's code triggered this)
                        order.amount,               # order_amount
                        parent_rate,                # commission_rate
                        parent_earned,              # commission_earned
                        "pending",                  # payout_status
                        str(datetime.now()),        # created_at
                    ])

                    print(f"2-tier commission: child {child_member.get('name')} ₹{child_earned} ({child_rate}%) | parent {parent_member.get('name')} ₹{parent_earned} ({parent_rate}%)")

                else:
                    # ── No parent: child gets their full commission_rate ───────
                    rate   = float(child_member.get("commission_rate", 0) or 0)
                    earned = round(order.amount * rate / 100, 2)

                    ref_sheet.append_row([
                        str(uuid.uuid4()),          # id
                        str(child_member["id"]),    # member_id
                        order_id,                   # order_id
                        order.user_id,              # student_id
                        order.course_id,            # course_id
                        code,                       # coupon_code
                        order.amount,               # order_amount
                        rate,                       # commission_rate
                        earned,                     # commission_earned
                        "pending",                  # payout_status
                        str(datetime.now()),        # created_at
                    ])

                    print(f"Commission recorded: ₹{earned} for member {child_member.get('name')}")

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


# ── Razorpay ──────────────────────────────────────────────────────────────────

@router.post("/razorpay/create-order")
def razorpay_create_order(payload: RazorpayOrderRequest):
    """
    Step 1 — Create a Razorpay order.
    Frontend calls this, then opens Razorpay modal with the returned razorpay_order_id.
    """
    if payload.amount < 1:
        raise HTTPException(status_code=400, detail="Amount must be at least ₹1")

    receipt = f"rcpt_{uuid.uuid4().hex[:12]}"

    try:
        rz_order = create_razorpay_order(payload.amount, receipt)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Razorpay error: {str(e)}")

    return {
        "razorpay_order_id": rz_order["id"],
        "amount":            rz_order["amount"],   # paise
        "currency":          rz_order["currency"],
        "key_id":            KEY_ID,               # public key — safe to send
    }


@router.post("/razorpay/verify-payment")
def razorpay_verify_payment(payload: RazorpayVerifyRequest):
    """
    Step 3 — Verify Razorpay signature and enroll the student.
    Orders sheet column 11 = status (id|user_id|course_id|amount|full_amount|
    payment_type|discount_code|discount_amount|reference|batch_id|STATUS|created_at)
    """
    if not all([payload.razorpay_order_id, payload.razorpay_payment_id, payload.razorpay_signature]):
        raise HTTPException(status_code=400, detail="Missing payment fields")

    # Verify HMAC signature
    valid = verify_razorpay_signature(
        payload.razorpay_order_id,
        payload.razorpay_payment_id,
        payload.razorpay_signature,
    )
    if not valid:
        raise HTTPException(status_code=400, detail="Payment signature verification failed")

    # Mark internal order as paid
    orders_sheet = get_sheet("orders")
    rows = orders_sheet.get_all_records()

    target_row = None
    target     = None
    for i, r in enumerate(rows, start=2):
        if str(r.get("id", "")) == payload.internal_order_id:
            target     = r
            target_row = i
            break

    if target and target_row:
        orders_sheet.update_cell(target_row, 11, "paid")   # col 11 = status
        try:
            orders_sheet.update_cell(target_row, 13, payload.razorpay_payment_id)  # col 13 = razorpay_payment_id (optional extra col)
        except Exception:
            pass

    # Enroll the student
    enrolled = False
    if payload.user_id and payload.course_id:
        reference = target.get("referance", "") if target else ""  # note: sheet has typo "referance"
        enrolled  = enroll_user(payload.user_id, payload.course_id, reference)

    return {
        "success":             True,
        "message":             "Payment verified and enrollment activated!",
        "razorpay_payment_id": payload.razorpay_payment_id,
        "enrolled":            enrolled,
    }
