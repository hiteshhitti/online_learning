from pydantic import BaseModel, EmailStr
from typing import Optional


class EnquiryCreate(BaseModel):
    name: str
    age: int
    email: EmailStr
    mobile: str
    enquiry: str
    reference: Optional[str] = ""   # how they found us
