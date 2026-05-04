from app.utils.sheets import get_sheet
import uuid
from datetime import datetime


def enroll_user(user_id: str, course_id: str, reference: str = ""):
    """Add a user→course enrollment row (idempotent)."""
    sheet = get_sheet("enrollments")
    existing = sheet.get_all_records()

    # Don't double-enroll
    for row in existing:
        if row.get("user_id") == user_id and row.get("course_id") == course_id:
            return False

    sheet.append_row([
        str(uuid.uuid4()),
        user_id,
        course_id,
        0,              # progress 0%
        reference,      # how student found us
        str(datetime.now()),
    ])
    return True
