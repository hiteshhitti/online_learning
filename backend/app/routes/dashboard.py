from fastapi import APIRouter
from app.utils.sheets import get_sheet

router = APIRouter()


@router.get("/stats")
def dashboard():
    """Return platform-wide stats from the Google Sheets data."""
    try:
        users_sheet = get_sheet("users")
        courses_sheet = get_sheet("courses")
        orders_sheet = get_sheet("orders")
        enrollments_sheet = get_sheet("enrollments")

        total_users = len(users_sheet.get_all_records())
        total_courses = len(courses_sheet.get_all_records())
        orders = orders_sheet.get_all_records()
        total_orders = len(orders)
        total_revenue = sum(float(o.get("amount", 0)) for o in orders if o.get("status") == "paid")
        total_enrollments = len(enrollments_sheet.get_all_records())

        return {
            "users": total_users,
            "courses": total_courses,
            "total_enrollments": total_enrollments,
            "total_orders": total_orders,
            "total_revenue": round(total_revenue, 2),
        }
    except Exception as e:
        # Return safe fallback if sheets are unavailable
        return {
            "users": 0,
            "courses": 0,
            "total_enrollments": 0,
            "total_orders": 0,
            "total_revenue": 0.0,
            "error": str(e),
        }
