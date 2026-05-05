"""
Admin-only routes — every endpoint requires a valid X-Admin-Token header.
Token is obtained via POST /admin/login with ADMIN_EMAIL + ADMIN_PASSWORD env vars.
"""
from fastapi import APIRouter, HTTPException, Depends
from app.utils.sheets import get_sheet
from app.utils.auth import require_admin, create_admin_token, hash_password
from pydantic import BaseModel
from typing import Optional
import uuid, os
from datetime import datetime

router = APIRouter()

ADMIN_EMAIL    = os.getenv("ADMIN_EMAIL",    "admin@learnhub.com")
ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD", "admin123")  # store hashed in prod


# ── Auth ──────────────────────────────────────────────────────────────────────

class AdminLogin(BaseModel):
    email: str
    password: str

@router.post("/login")
def admin_login(payload: AdminLogin):
    if payload.email != ADMIN_EMAIL or payload.password != ADMIN_PASSWORD:
        raise HTTPException(status_code=401, detail="Invalid admin credentials")
    token = create_admin_token(payload.email)
    return {"access_token": token, "token_type": "bearer"}


# ── Dashboard Stats ───────────────────────────────────────────────────────────

@router.get("/stats", dependencies=[Depends(require_admin)])
def admin_stats():
    users_sheet       = get_sheet("users")
    courses_sheet     = get_sheet("courses")
    orders_sheet      = get_sheet("orders")
    enrollments_sheet = get_sheet("enrollments")
    enquiries_sheet   = get_sheet("enquiry")

    orders      = orders_sheet.get_all_records()
    paid_orders = [o for o in orders if str(o.get("status","")).lower() == "paid"]
    revenue     = sum(float(o.get("amount", 0)) for o in paid_orders)

    return {
        "total_users":       len(users_sheet.get_all_records()),
        "total_courses":     len(courses_sheet.get_all_records()),
        "total_enrollments": len(enrollments_sheet.get_all_records()),
        "total_orders":      len(paid_orders),
        "total_revenue":     round(revenue, 2),
        "total_enquiries":   len(enquiries_sheet.get_all_records()),
    }


# ── Courses ───────────────────────────────────────────────────────────────────

class CourseCreate(BaseModel):
    title: str
    description: str
    price: float
    category: Optional[str] = ""
    level: Optional[str] = "Beginner"
    instructor: Optional[str] = ""
    duration: Optional[str] = ""
    image: Optional[str] = ""

@router.get("/courses", dependencies=[Depends(require_admin)])
def list_courses():
    return get_sheet("courses").get_all_records()

@router.post("/courses", dependencies=[Depends(require_admin)])
def create_course(course: CourseCreate):
    sheet     = get_sheet("courses")
    course_id = str(uuid.uuid4())
    sheet.append_row([
        course_id, course.title, course.description, course.price,
        course.category, course.level, course.instructor,
        course.duration, course.image, str(datetime.now()),
    ])
    return {"msg": "Course created", "id": course_id}

@router.patch("/courses/{course_id}", dependencies=[Depends(require_admin)])
def update_course(course_id: str, course: CourseCreate):
    sheet   = get_sheet("courses")
    rows    = sheet.get_all_records()
    for i, r in enumerate(rows, start=2):
        if str(r.get("id")) == course_id:
            sheet.update(f"A{i}:J{i}", [[
                course_id, course.title, course.description, course.price,
                course.category, course.level, course.instructor,
                course.duration, course.image, r.get("created_at", str(datetime.now())),
            ]])
            return {"msg": "Course updated"}
    raise HTTPException(status_code=404, detail="Course not found")

@router.delete("/courses/{course_id}", dependencies=[Depends(require_admin)])
def delete_course(course_id: str):
    sheet = get_sheet("courses")
    rows  = sheet.get_all_records()
    for i, r in enumerate(rows, start=2):
        if str(r.get("id")) == course_id:
            sheet.delete_rows(i)
            return {"msg": "Course deleted"}
    raise HTTPException(status_code=404, detail="Course not found")


# ── Enrollments ───────────────────────────────────────────────────────────────

@router.get("/enrollments", dependencies=[Depends(require_admin)])
def list_enrollments(discount_code: Optional[str] = None):
    """List all enrollments. Optionally filter by discount_code used at checkout."""
    enrollments = get_sheet("enrollments").get_all_records()
    users       = get_sheet("users").get_all_records()
    courses     = get_sheet("courses").get_all_records()
    orders      = get_sheet("orders").get_all_records()

    user_map   = {u["id"]: u for u in users}
    course_map = {str(c["id"]): c for c in courses}
    # order keyed by user_id+course_id for discount lookup
    order_map  = {(str(o.get("user_id")), str(o.get("course_id"))): o for o in orders}

    result = []
    for e in enrollments:
        uid  = str(e.get("user_id", ""))
        cid  = str(e.get("course_id", ""))
        order = order_map.get((uid, cid), {})
        code  = str(order.get("discount_code", "")).strip()

        if discount_code and code.upper() != discount_code.upper():
            continue

        u = user_map.get(uid, {})
        c = course_map.get(cid, {})
        result.append({
            "enrollment_id":  e.get("id", ""),
            "user_id":        uid,
            "student_name":   u.get("name", "—"),
            "student_email":  u.get("email", "—"),
            "course_id":      cid,
            "course_title":   c.get("title", "—"),
            "progress":       e.get("progress", 0),
            "reference":      e.get("reference", ""),
            "enrolled_at":    e.get("enrolled_at", ""),
            "amount_paid":    order.get("amount", "—"),
            "discount_code":  code,
            "discount_amount":order.get("discount_amount", 0),
        })
    return result


# ── Enquiries ─────────────────────────────────────────────────────────────────

@router.get("/enquiries", dependencies=[Depends(require_admin)])
def list_enquiries():
    return get_sheet("enquiry").get_all_records()


# ── Discounts ─────────────────────────────────────────────────────────────────

class DiscountCreate(BaseModel):
    code: Optional[str] = None          # blank = auto-generate
    type: str = "percent"               # "percent" | "flat"
    value: float
    max_uses: int = 0                   # 0 = unlimited
    course_id: Optional[str] = ""      # blank = all courses
    active: bool = True

@router.get("/discounts", dependencies=[Depends(require_admin)])
def list_discounts():
    rows = get_sheet("discounts").get_all_records()
    # attach usage stats
    orders = get_sheet("orders").get_all_records()
    for r in rows:
        r["times_used"] = sum(
            1 for o in orders
            if str(o.get("discount_code","")).upper() == str(r.get("code","")).upper()
        )
    return rows

@router.post("/discounts", dependencies=[Depends(require_admin)])
def create_discount(d: DiscountCreate):
    sheet = get_sheet("discounts")
    # auto-generate code if blank
    code = (d.code or "").strip().upper()
    if not code:
        code = "DISC" + str(uuid.uuid4())[:6].upper()
    # check uniqueness
    existing = sheet.get_all_records()
    if any(str(r.get("code","")).upper() == code for r in existing):
        raise HTTPException(status_code=400, detail=f"Code '{code}' already exists")
    sheet.append_row([
        code, d.type, d.value, d.max_uses, 0,
        "true" if d.active else "false",
        d.course_id or "",
        str(datetime.now()),
    ])
    return {"msg": "Discount created", "code": code}

@router.patch("/discounts/{code}", dependencies=[Depends(require_admin)])
def toggle_discount(code: str, active: bool):
    sheet = get_sheet("discounts")
    rows  = sheet.get_all_records()
    for i, r in enumerate(rows, start=2):
        if str(r.get("code","")).upper() == code.upper():
            sheet.update_cell(i, 6, "true" if active else "false")
            return {"msg": f"Code {'activated' if active else 'deactivated'}"}
    raise HTTPException(status_code=404, detail="Discount code not found")

@router.delete("/discounts/{code}", dependencies=[Depends(require_admin)])
def delete_discount(code: str):
    sheet = get_sheet("discounts")
    rows  = sheet.get_all_records()
    for i, r in enumerate(rows, start=2):
        if str(r.get("code","")).upper() == code.upper():
            sheet.delete_rows(i)
            return {"msg": "Discount deleted"}
    raise HTTPException(status_code=404, detail="Discount code not found")


# ── Public Stats (used by public /dashboard page) ─────────────────────────────

@router.get("/public-stats")
def public_stats():
    """No auth required — used by student-facing dashboard."""
    try:
        enrollments = get_sheet("enrollments").get_all_records()
        courses     = get_sheet("courses").get_all_records()
        users       = get_sheet("users").get_all_records()
        return {
            "total_students":    len(users),
            "total_courses":     len(courses),
            "total_enrollments": len(enrollments),
            "courses":           [{"id": c.get("id"), "title": c.get("title"),
                                   "instructor": c.get("instructor",""),
                                   "category": c.get("category","")} for c in courses],
        }
    except Exception as e:
        return {"total_students": 0, "total_courses": 0, "total_enrollments": 0,
                "courses": [], "error": str(e)}


# ── Member management ─────────────────────────────────────────────────────────

from app.schemas.member import MemberCreate, MemberUpdate, PayoutCreate

@router.post("/members", dependencies=[Depends(require_admin)])
def create_member(m: MemberCreate):
    sheet = get_sheet("members")
    rows = sheet.get_all_records()

    if any(str(r.get("email", "")).lower() == m.email.lower() for r in rows):
        raise HTTPException(status_code=400, detail="Email already registered")

    discounts = get_sheet("discounts").get_all_records()
    matched = next(
        (d for d in discounts if str(d.get("code", "")).upper() == m.coupon_code.upper()),
        None,
    )
    if not matched:
        raise HTTPException(
            status_code=400,
            detail=f"Coupon code '{m.coupon_code}' not found in discounts sheet. Create it there first.",
        )

    member_id = str(uuid.uuid4())
    sheet.append_row([
        member_id, m.name, m.email, hash_password(m.password),
        m.commission_rate, m.coupon_code.upper(), "true", str(datetime.now()),
    ])

    # Link discount code → member (col I = member_id)
    ds = get_sheet("discounts")
    disc_rows = ds.get_all_records()
    for i, d in enumerate(disc_rows, start=2):
        if str(d.get("code", "")).upper() == m.coupon_code.upper():
            ds.update_cell(i, 9, member_id)
            break

    return {"msg": "Member created", "id": member_id}


@router.get("/members", dependencies=[Depends(require_admin)])
def list_members():
    members   = get_sheet("members").get_all_records()
    referrals = get_sheet("member_referrals").get_all_records()
    payouts   = get_sheet("member_payouts").get_all_records()

    result = []
    for m in members:
        mid     = str(m.get("id"))
        my_refs = [r for r in referrals if str(r.get("member_id")) == mid]
        total   = round(sum(float(r.get("commission_earned", 0) or 0) for r in my_refs), 2)
        pending = round(sum(
            float(r.get("commission_earned", 0) or 0)
            for r in my_refs if str(r.get("payout_status", "")).lower() == "pending"
        ), 2)
        paid = round(sum(float(p.get("amount", 0) or 0)
                         for p in payouts if str(p.get("member_id")) == mid), 2)
        result.append({
            "id": mid, "name": m.get("name"), "email": m.get("email"),
            "coupon_code": m.get("coupon_code"), "commission_rate": m.get("commission_rate"),
            "active": m.get("active"), "total_referrals": len(my_refs),
            "total_earned": total, "pending_payout": pending, "total_paid": paid,
            "created_at": m.get("created_at"),
        })
    return result


@router.get("/members/{member_id}/referrals", dependencies=[Depends(require_admin)])
def get_member_referrals(member_id: str):
    referrals = get_sheet("member_referrals").get_all_records()
    users     = {u["id"]: u for u in get_sheet("users").get_all_records()}
    courses   = {str(c["id"]): c for c in get_sheet("courses").get_all_records()}

    result = []
    for r in referrals:
        if str(r.get("member_id")) != member_id:
            continue
        student = users.get(str(r.get("student_id", "")), {})
        course  = courses.get(str(r.get("course_id", "")), {})
        result.append({
            **r,
            "student_name":  student.get("name", "—"),
            "student_email": student.get("email", "—"),
            "course_title":  course.get("title", "—"),
        })
    result.sort(key=lambda x: x.get("created_at", ""), reverse=True)
    return result


@router.patch("/members/{member_id}/commission", dependencies=[Depends(require_admin)])
def update_member(member_id: str, body: MemberUpdate):
    sheet = get_sheet("members")
    rows  = sheet.get_all_records()
    for i, m in enumerate(rows, start=2):
        if str(m.get("id")) == member_id:
            if body.commission_rate is not None:
                sheet.update_cell(i, 5, body.commission_rate)
            if body.active is not None:
                sheet.update_cell(i, 7, "true" if body.active else "false")
            return {"msg": "Member updated"}
    raise HTTPException(status_code=404, detail="Member not found")


@router.post("/members/{member_id}/payout", dependencies=[Depends(require_admin)])
def process_payout(member_id: str, body: PayoutCreate):
    ref_sheet = get_sheet("member_referrals")
    referrals = ref_sheet.get_all_records()

    pending = [
        (i + 2, r) for i, r in enumerate(referrals)
        if str(r.get("member_id")) == member_id
        and str(r.get("payout_status", "")).lower() == "pending"
    ]
    if not pending:
        raise HTTPException(status_code=400, detail="No pending referrals for this member")

    referral_ids = ",".join(str(r.get("id", "")) for _, r in pending)
    for row_num, _ in pending:
        ref_sheet.update_cell(row_num, 10, "paid")   # col 10 = payout_status

    get_sheet("member_payouts").append_row([
        str(uuid.uuid4()), member_id, body.amount,
        referral_ids, body.payment_method or "", body.notes or "",
        str(datetime.now()),
    ])
    return {"msg": f"Payout processed for {len(pending)} referrals", "referral_count": len(pending)}


# ── Orders & Enrollment Activation ───────────────────────────────────────────

@router.get("/orders", dependencies=[Depends(require_admin)])
def list_orders():
    """List all orders with student and course info. Shows pending + paid."""
    orders  = get_sheet("orders").get_all_records()
    users   = {str(u["id"]): u for u in get_sheet("users").get_all_records()}
    courses = {str(c["id"]): c for c in get_sheet("courses").get_all_records()}

    result = []
    for o in orders:
        uid = str(o.get("user_id", ""))
        cid = str(o.get("course_id", ""))
        u = users.get(uid, {})
        c = courses.get(cid, {})
        result.append({
            "order_id":      o.get("order_id", ""),
            "student_name":  u.get("name", "—"),
            "student_email": u.get("email", "—"),
            "course_title":  c.get("title", "—"),
            "batch_id":      o.get("batch_id", ""),
            "amount":        o.get("amount", 0),
            "discount_code": o.get("discount_code", ""),
            "status":        o.get("status", "pending"),
            "reference":     o.get("reference", ""),
            "created_at":    o.get("created_id") or o.get("created_at", ""),
            "user_id":       uid,
            "course_id":     cid,
        })

    # Sort newest first
    result.sort(key=lambda x: x.get("created_at", ""), reverse=True)
    return result


@router.patch("/orders/{order_id}/activate", dependencies=[Depends(require_admin)])
def activate_order(order_id: str):
    """
    Mark an order as paid AND enroll the student in the course.
    Call this after verifying the student's UPI payment screenshot.
    """
    from app.utils.helpers import enroll_user

    orders_sheet = get_sheet("orders")
    rows = orders_sheet.get_all_records()

    target = None
    target_row = None
    for i, r in enumerate(rows, start=2):
        if str(r.get("order_id", "")) == order_id:
            target = r
            target_row = i
            break

    if not target:
        raise HTTPException(status_code=404, detail="Order not found")

    if str(target.get("status", "")).lower() == "paid":
        return {"msg": "Order is already activated", "order_id": order_id}

    # Mark order as paid (column 9 = status)
    orders_sheet.update_cell(target_row, 9, "paid")

    # Enroll the student
    user_id   = str(target.get("user_id", ""))
    course_id = str(target.get("course_id", ""))
    reference = str(target.get("reference", ""))

    enrolled = enroll_user(user_id, course_id, reference)

    return {
        "msg": "Order activated and student enrolled successfully",
        "order_id": order_id,
        "user_id": user_id,
        "course_id": course_id,
        "already_enrolled": not enrolled,
    }


@router.patch("/orders/{order_id}/reject", dependencies=[Depends(require_admin)])
def reject_order(order_id: str):
    """Mark an order as rejected (fake/wrong payment)."""
    orders_sheet = get_sheet("orders")
    rows = orders_sheet.get_all_records()

    for i, r in enumerate(rows, start=2):
        if str(r.get("order_id", "")) == order_id:
            orders_sheet.update_cell(i, 9, "rejected")
            return {"msg": "Order rejected", "order_id": order_id}

    raise HTTPException(status_code=404, detail="Order not found")


@router.get("/orders", dependencies=[Depends(require_admin)])
def list_all_orders():
    """List all orders with student and course details for instalment management."""
    orders      = get_sheet("orders").get_all_records()
    users       = get_sheet("users").get_all_records()
    courses     = get_sheet("courses").get_all_records()

    user_map   = {str(u.get("id")): u for u in users}
    course_map = {str(c.get("id")): c for c in courses}

    result = []
    for o in orders:
        user   = user_map.get(str(o.get("user_id")), {})
        course = course_map.get(str(o.get("course_id")), {})
        result.append({
            "order_id":      o.get("id") or o.get("order_id", ""),
            "user_id":       o.get("user_id", ""),
            "course_id":     o.get("course_id", ""),
            "student_name":  user.get("name", ""),
            "student_email": user.get("email", ""),
            "course_title":  course.get("title", ""),
            "course_price":  course.get("price", 0),
            "amount":        o.get("amount", 0),
            "amount_paid":   o.get("amount", 0),
            "status":        o.get("status", "pending"),
            "reference":     o.get("reference", ""),
            "created_at":    o.get("created_id") or o.get("created_at", ""),
        })
    return result
