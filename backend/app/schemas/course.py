from pydantic import BaseModel
from typing import Optional

class CourseBase(BaseModel):
    title: str
    description: str
    price: int

class CourseCreate(CourseBase):
    pass

class CourseOut(CourseBase):
    id: int

    class Config:
        from_attributes = True