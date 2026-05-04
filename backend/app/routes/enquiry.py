from fastapi import APIRouter, HTTPException
from app.utils.sheets import get_sheet
from app.schemas.enquiry import EnquiryCreate
from datetime import datetime

router = APIRouter()


@router.post("/")
def submit_enquiry(enquiry: EnquiryCreate):
    """Submit a new enquiry — saved to the 'enquiry' sheet.
    Sheet columns: name | age | email | mobile | enquiry | reference | submitted_at
    """
    try:
        sheet = get_sheet("enquiry")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Could not access enquiry sheet: {str(e)}")

    sheet.append_row([
        enquiry.name,
        enquiry.age,
        enquiry.email,
        enquiry.mobile,
        enquiry.enquiry,
        enquiry.reference or "",
        str(datetime.now()),
    ])

    return {"msg": "Enquiry submitted successfully"}


@router.get("/")
def get_enquiries():
    """List all enquiries (admin use)."""
    sheet = get_sheet("enquiry")
    return sheet.get_all_records()
