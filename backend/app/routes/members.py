"""
Member routes — for referral members (not students, not admins).
Each member has a unique coupon code. When a student uses their code,
commission is automatically calculated and recorded.
"""
from fastapi import APIRouter, HTTPException, Header
from app.utils.sheets import get_sheet
from app.utils.auth import create_token, decode_token, hash_password, verify_password
from app.schemas.member import MemberLogin
from typing import Optional
from jose import JWTError

router = APIRouter()


# ── Auth helper ───────────────────────────────────────────────────────────────

def require_member(authorization: Optional[str] = Header(None)) -> dict:
    """FastAPI dependency — validates member JWT from Authorization header."""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Member token required")
    token = authorization.split(" ", 1)[1]
    try:
        payload = decode_token(token)
        if payload.get("role") != "member":
            raise HTTPException(status_code=403, detail="Not a member token")
        return payload
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid or expired token")


def _get_member_by_id(member_id: str) -> Optional[dict]:
    rows = get_sheet("members").get_all_records()
    return next((m for m in rows if str(m.get("id")) == member_id), None)


# ── Login ─────────────────────────────────────────────────────────────────────

@router.post("/login")
def member_login(payload: MemberLogin):
    sheet = get_sheet("members")
    rows = sheet.get_all_records()

    member = next(
        (m for m in rows if str(m.get("email", "")).lower() == payload.email.lower()),
        None,
    )
    if not member:
        raise HTTPException(status_code=401, detail="Invalid email or password")
    if not verify_password(payload.password, str(member.get("password", ""))):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    if str(member.get("active", "true")).lower() != "true":
        raise HTTPException(status_code=403, detail="Account is inactive. Contact admin.")

    token = create_token({
        "sub": str(member["id"]),
        "email": member["email"],
        "role": "member",
    })

    return {
        "access_token": token,
        "token_type": "bearer",
        "member": {
            "id": member["id"],
            "name": member["name"],
            "email": member["email"],
            "coupon_code": member.get("coupon_code", ""),
            "commission_rate": member.get("commission_rate", 0),
        },
    }


# ── Profile ───────────────────────────────────────────────────────────────────
@router.get("/me/profile")
def get_profile(authorization: Optional[str] = Header(None)):
    member_payload = require_member(authorization)
    member = _get_member_by_id(member_payload["sub"])
    if not member:
        raise HTTPException(status_code=404, detail="Member not found")
    return {
        "id": member["id"],
        "name": member["name"],
        "email": member["email"],
        "coupon_code": member.get("coupon_code", ""),
        "commission_rate": member.get("commission_rate", 0),
        "active": member.get("active", "true"),
        "created_at": member.get("created_at", ""),
    }


# ── Dashboard stats ───────────────────────────────────────────────────────────

@router.get("/me/stats")
def get_stats(authorization: Optional[str] = Header(None)):
    member_payload = require_member(authorization)
    member_id = member_payload["sub"]

    referrals = get_sheet("member_referrals").get_all_records()
    my_referrals = [r for r in referrals if str(r.get("member_id")) == member_id]

    total_referrals  = len(my_referrals)
    total_earned     = round(sum(float(r.get("commission_earned", 0) or 0) for r in my_referrals), 2)
    pending_payout   = round(sum(
        float(r.get("commission_earned", 0) or 0)
        for r in my_referrals if str(r.get("payout_status", "")).lower() == "pending"
    ), 2)
    paid_out         = round(total_earned - pending_payout, 2)

    member = _get_member_by_id(member_id)

    return {
        "total_referrals":  total_referrals,
        "total_earned":     total_earned,
        "pending_payout":   pending_payout,
        "paid_out":         paid_out,
        "coupon_code":      member.get("coupon_code", "") if member else "",
        "commission_rate":  member.get("commission_rate", 0) if member else 0,
    }


# ── Referral list ─────────────────────────────────────────────────────────────

@router.get("/me/referrals")
def get_referrals(authorization: Optional[str] = Header(None)):
    member_payload = require_member(authorization)
    member_id = member_payload["sub"]

    referrals = get_sheet("member_referrals").get_all_records()
    my_referrals = [r for r in referrals if str(r.get("member_id")) == member_id]

    users   = {u["id"]: u for u in get_sheet("users").get_all_records()}
    courses = {str(c["id"]): c for c in get_sheet("courses").get_all_records()}

    result = []
    for r in my_referrals:
        student = users.get(str(r.get("student_id", "")), {})
        course  = courses.get(str(r.get("course_id", "")), {})
        sname   = student.get("name", "—")
        # Mask student name for privacy: "Priya Sharma" → "Priya S."
        parts = sname.split()
        masked = f"{parts[0]} {parts[-1][0]}." if len(parts) > 1 else sname
        result.append({
            "id":               r.get("id"),
            "student_name":     masked,
            "course_title":     course.get("title", "—"),
            "coupon_code":      r.get("coupon_code", ""),
            "order_amount":     r.get("order_amount", 0),
            "commission_rate":  r.get("commission_rate", 0),
            "commission_earned":r.get("commission_earned", 0),
            "payout_status":    r.get("payout_status", "pending"),
            "created_at":       r.get("created_at", ""),
        })

    # Newest first
    result.sort(key=lambda x: x["created_at"], reverse=True)
    return result
