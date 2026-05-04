from pydantic import BaseModel
from typing import Optional


class BatchCreate(BaseModel):
    course_id: str
    name: str
    start_date: str          # "YYYY-MM-DD"
    timing: str              # e.g. "Mon/Wed/Fri  9:00 AM – 11:00 AM"
    seats_total: int
    mode: str = "Online"     # Online | Offline | Hybrid
    is_active: bool = True


class BatchUpdate(BaseModel):
    name: Optional[str] = None
    start_date: Optional[str] = None
    timing: Optional[str] = None
    seats_total: Optional[int] = None
    mode: Optional[str] = None
    is_active: Optional[bool] = None
