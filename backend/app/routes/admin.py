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

ADMIN_EMAIL    = os.getenv("ADMIN_EMAIL",    "hitesh@uitcec.com")
ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD", "PythonDS123$")  # store hashed in prod


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


# ── Users ────────────────────────────────────────────────────────────────────

@router.get("/users", dependencies=[Depends(require_admin)])
def list_users():
    """List all registered users."""
    users = get_sheet("users").get_all_records()
    return [
        {
            "id":         str(u.get("id", "")),
            "name":       u.get("name", ""),
            "email":      u.get("email", ""),
            "created_at": u.get("created_at", ""),
        }
        for u in users
        if u.get("id")  # skip empty rows
    ]


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

    code = m.coupon_code.strip().upper()

    # ── Auto-create the discount coupon if it doesn't exist yet ───────────────
    ds = get_sheet("discounts")
    discounts = ds.get_all_records()
    matched = next((d for d in discounts if str(d.get("code", "")).upper() == code), None)

    member_id = str(uuid.uuid4())

    if not matched:
        # discount_rate is how much % students save; defaults to commission_rate
        discount_value = float(m.discount_rate if m.discount_rate is not None else m.commission_rate)
        # Columns: code | type | value | max_uses | used | active | course_id | created_at | member_id
        ds.append_row([
            code,                   # code
            "percent",              # type  (always % for referral coupons)
            discount_value,         # value (e.g. 10 → 10% off)
            0,                      # max_uses (0 = unlimited)
            0,                      # used
            "true",                 # active
            "",                     # course_id (blank = all courses)
            str(datetime.now()),    # created_at
            member_id,              # member_id  (link)
        ])
    else:
        # Discount already exists — just link member_id to it (col 9)
        disc_rows = ds.get_all_records()
        for i, d in enumerate(disc_rows, start=2):
            if str(d.get("code", "")).upper() == code:
                ds.update_cell(i, 9, member_id)
                break
    # ── End auto-create discount ───────────────────────────────────────────────

    # col layout: id | name | email | password | commission_rate | coupon_code | active | referred_by_member_id | parent_commission_rate | created_at
    sheet.append_row([
        member_id, m.name, m.email, hash_password(m.password),
        m.commission_rate, code, "true",
        m.referred_by_member_id or "",          # col 8: parent member who recruited this one
        m.parent_commission_rate if m.parent_commission_rate is not None else "",  # col 9: % parent earns on this member's sales
        str(datetime.now()),                    # col 10
    ])

    return {"msg": "Member created", "id": member_id, "coupon_code": code}


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
        # Count sub-members this member has recruited
        sub_members = [
            sm for sm in members
            if str(sm.get("referred_by_member_id", "")).strip() == mid
        ]

        result.append({
            "id": mid, "name": m.get("name"), "email": m.get("email"),
            "coupon_code": m.get("coupon_code"), "commission_rate": m.get("commission_rate"),
            "active": m.get("active"), "total_referrals": len(my_refs),
            "total_earned": total, "pending_payout": pending, "total_paid": paid,
            "created_at": m.get("created_at"),
            "referred_by_member_id": m.get("referred_by_member_id", ""),
            "sub_members_count": len(sub_members),
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


# ── Instalment Plans ─────────────────────────────────────────────────────────

class InstalmentPlanCreate(BaseModel):
    user_id: str
    course_id: str
    num_instalments: int        # e.g. 4 means 4 equal parts

@router.post("/instalment-plans", dependencies=[Depends(require_admin)])
def create_instalment_plan(payload: InstalmentPlanCreate):
    """
    Admin enables part payment for a specific student+course combo.
    Calculates EMI = course_price / num_instalments.
    Stores in 'instalment_plans' sheet.
    """
    courses = get_sheet("courses").get_all_records()
    course  = next((c for c in courses if str(c.get("id")) == str(payload.course_id)), None)
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    price = float(course.get("price", 0) or 0)
    if price <= 0:
        raise HTTPException(status_code=400, detail="Course has no price set")
    if payload.num_instalments < 2:
        raise HTTPException(status_code=400, detail="Minimum 2 instalments required")

    emi = round(price / payload.num_instalments, 2)

    # Check if plan already exists for this user+course
    sheet = get_sheet("instalment_plans")
    existing = sheet.get_all_records()
    for r in existing:
        if str(r.get("user_id")) == str(payload.user_id) and str(r.get("course_id")) == str(payload.course_id):
            raise HTTPException(status_code=400, detail="Instalment plan already exists for this student and course")

    plan_id = str(uuid.uuid4())
    sheet.append_row([
        plan_id,
        payload.user_id,
        payload.course_id,
        payload.num_instalments,
        emi,
        price,
        "active",
        str(datetime.now()),
    ])
    return {
        "msg": "Instalment plan created",
        "plan_id": plan_id,
        "num_instalments": payload.num_instalments,
        "emi_amount": emi,
        "total_price": price,
    }

@router.get("/instalment-plans", dependencies=[Depends(require_admin)])
def list_instalment_plans():
    """List all instalment plans with student and course details."""
    plans   = get_sheet("instalment_plans").get_all_records()
    users   = {str(u["id"]): u for u in get_sheet("users").get_all_records()}
    courses = {str(c["id"]): c for c in get_sheet("courses").get_all_records()}

    result = []
    for p in plans:
        u = users.get(str(p.get("user_id", "")), {})
        c = courses.get(str(p.get("course_id", "")), {})
        result.append({
            "plan_id":         p.get("id", ""),
            "user_id":         p.get("user_id", ""),
            "course_id":       p.get("course_id", ""),
            "student_name":    u.get("name", "—"),
            "student_email":   u.get("email", "—"),
            "course_title":    c.get("title", "—"),
            "course_price":    p.get("total_price", 0),
            "num_instalments": p.get("num_instalments", 0),
            "emi_amount":      p.get("emi_amount", 0),
            "status":          p.get("status", "active"),
            "created_at":      p.get("created_at", ""),
        })
    result.sort(key=lambda x: x.get("created_at", ""), reverse=True)
    return result

@router.delete("/instalment-plans/{plan_id}", dependencies=[Depends(require_admin)])
def delete_instalment_plan(plan_id: str):
    """Remove an instalment plan (disables part payment for that student)."""
    sheet = get_sheet("instalment_plans")
    rows  = sheet.get_all_records()
    for i, r in enumerate(rows, start=2):
        if str(r.get("id", "")) == plan_id:
            sheet.delete_rows(i)
            return {"msg": "Instalment plan removed"}
    raise HTTPException(status_code=404, detail="Plan not found")


# ── Orders & Enrollment Activation ───────────────────────────────────────────

@router.get("/orders", dependencies=[Depends(require_admin)])
def list_orders():
    """List all orders with student and course info. Shows pending + paid."""
    orders  = get_sheet("orders").get_all_records()
    users   = {str(u["id"]): u for u in get_sheet("users").get_all_records()}
    courses = {str(c["id"]): c for c in get_sheet("courses").get_all_records()}

    # Build instalment totals per order
    try:
        instalments = get_sheet("instalments").get_all_records()
        inst_totals: dict = {}
        for inst in instalments:
            oid = str(inst.get("order_id", ""))
            inst_totals[oid] = inst_totals.get(oid, 0) + float(inst.get("amount", 0) or 0)
    except:
        inst_totals = {}

    result = []
    for o in orders:
        uid = str(o.get("user_id", ""))
        cid = str(o.get("course_id", ""))
        u = users.get(uid, {})
        c = courses.get(cid, {})
        amount      = float(o.get("amount", 0) or 0)
        course_price = float(c.get("price", 0) or 0)
        full_amount  = float(o.get("full_amount") or 0) or course_price or amount
        result.append({
            "order_id":      o.get("id") or o.get("order_id", ""),
            "student_name":  u.get("name", "—"),
            "student_email": u.get("email", "—"),
            "course_title":  c.get("title", "—"),
            "course_price":  float(c.get("price", 0) or 0),
            "batch_id":      o.get("batch_id", ""),
            "amount":        amount,
            "full_amount":   full_amount,
            "amount_paid":   inst_totals.get(str(o.get("id") or o.get("order_id", "")), amount),
            "payment_type":  o.get("payment_type", "full"),
            "discount_code": o.get("discount_code", ""),
            "status":        o.get("status", "pending"),
            "reference":     o.get("reference", ""),
            "created_at":    o.get("created_at", "") or o.get("created_id", ""),
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
        if str(r.get("id") or r.get("order_id", "")) == order_id:
            target = r
            target_row = i
            break

    if not target:
        raise HTTPException(status_code=404, detail="Order not found")

    if str(target.get("status", "")).lower() == "paid":
        return {"msg": "Order is already activated", "order_id": order_id}

    # Mark order as paid (column 11 = status — after id,user_id,course_id,amount,full_amount,payment_type,discount_code,discount_amount,reference,batch_id,STATUS)
    orders_sheet.update_cell(target_row, 11, "paid")

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
        if str(r.get("id") or r.get("order_id", "")) == order_id:
            orders_sheet.update_cell(i, 11, "rejected")  # column 11 = status
            return {"msg": "Order rejected", "order_id": order_id}

    raise HTTPException(status_code=404, detail="Order not found")


# ── Instalment Payments ───────────────────────────────────────────────────────

@router.get("/instalment-plans/check")
def check_instalment_plan(user_id: str, course_id: str):
    """
    Called by checkout page to check if part payment is enabled for this student+course.
    Returns plan details if exists, else returns enabled: false.
    """
    plans = get_sheet("instalment_plans").get_all_records()
    plan  = next(
        (p for p in plans
         if str(p.get("user_id")) == str(user_id)
         and str(p.get("course_id")) == str(course_id)
         and str(p.get("status", "active")).lower() == "active"),
        None
    )
    if not plan:
        return {"enabled": False}
    return {
        "enabled":         True,
        "plan_id":         plan.get("id", ""),
        "num_instalments": int(plan.get("num_instalments", 0)),
        "emi_amount":      float(plan.get("emi_amount", 0)),
        "total_price":     float(plan.get("total_price", 0)),
    }


@router.post("/orders/{order_id}/instalments", dependencies=[Depends(require_admin)])
def add_instalment(order_id: str, payload: dict):
    """Record a part payment. Auto-enrolls when total paid >= full amount."""
    from app.utils.helpers import enroll_user as _enroll

    inst_sheet   = get_sheet("instalments")
    orders_sheet = get_sheet("orders")

    all_instalments = inst_sheet.get_all_records()
    previous_paid   = sum(
        float(i.get("amount", 0) or 0)
        for i in all_instalments
        if str(i.get("order_id")) == str(order_id)
    )

    new_amount = float(payload.get("amount", 0))
    total_paid = previous_paid + new_amount

    inst_sheet.append_row([
        str(uuid.uuid4()),
        order_id,
        payload.get("user_id", ""),
        payload.get("course_id", ""),
        new_amount,
        payload.get("reference", ""),
        payload.get("note", ""),
        str(datetime.now()),
    ])

    # Get full amount from order
    all_orders = orders_sheet.get_all_records()
    order_row  = next(
        (o for o in all_orders
         if str(o.get("id") or o.get("order_id", "")) == str(order_id)),
        None
    )
    full_amount = float((order_row or {}).get("full_amount") or (order_row or {}).get("amount") or 0)
    fully_paid  = full_amount > 0 and total_paid >= full_amount

    if fully_paid and order_row:
        for i, o in enumerate(all_orders, start=2):
            if str(o.get("id") or o.get("order_id", "")) == str(order_id):
                headers = orders_sheet.row_values(1)
                if "status" in headers:
                    orders_sheet.update_cell(i, headers.index("status") + 1, "active")
                try:
                    _enroll(payload.get("user_id"), payload.get("course_id"))
                except Exception as e:
                    print(f"Enroll error: {e}")
                break

    return {
        "msg":          "Instalment recorded",
        "previous_paid": previous_paid,
        "this_payment":  new_amount,
        "total_paid":    total_paid,
        "full_amount":   full_amount,
        "fully_paid":    fully_paid,
        "enrolled":      fully_paid,
    }


@router.get("/orders/{order_id}/instalments", dependencies=[Depends(require_admin)])
def get_instalments(order_id: str):
    sheet = get_sheet("instalments")
    rows  = [i for i in sheet.get_all_records() if str(i.get("order_id")) == str(order_id)]
    return {
        "order_id":   order_id,
        "instalments": rows,
        "total_paid":  sum(float(r.get("amount", 0) or 0) for r in rows),
    }
