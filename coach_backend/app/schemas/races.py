from pydantic import BaseModel, Field
from datetime import date
from typing import Literal, Optional

Priority = Literal["A", "B", "C"]
CourseType = Literal["road", "trail", "track", "other", "run", "bike", "swim", "duathlon", "triathlon", "cycling"]


class RaceGoalCreate(BaseModel):
    athlete_id: int = Field(..., description="FK a ahtlete_profile.athlete_id")
    name: str
    race_date: date
    distance_m: int = Field(..., gt=0)
    goal_time_sec: int = Field(..., gt=0)
    course_type: Optional[CourseType] = None
    priority: Optional[Priority] = None
    notes: Optional[str] = None

class RaceGoalOut(RaceGoalCreate):
    id: int

    class Config:
        from_attributes = True

class RaceGoalPatch(BaseModel):
    name: Optional[str] = None
    race_date: Optional[date] = None
    distance_m: Optional[int] = Field(default=None, gt=0)
    goal_time_sec: Optional[int] = Field(default=None, gt=0)
    course_type: Optional[CourseType] = None
    priority: Optional[Priority] = None
    notes: Optional[str] = None