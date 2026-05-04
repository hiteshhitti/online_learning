from fastapi import APIRouter, HTTPException
from app.utils.sheets import get_sheet

router = APIRouter()


@router.get("/")
def get_courses():
    """Return all courses from the Google Sheet."""
    sheet = get_sheet("courses")
    return sheet.get_all_records()


@router.get("/{course_id}")
def get_course(course_id: str):
    """Return a single course by id."""
    sheet = get_sheet("courses")
    courses = sheet.get_all_records()
    course = next((c for c in courses if str(c.get("id")) == str(course_id)), None)
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    return course
