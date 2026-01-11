from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List

class RegisterIn(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=8, max_length=72)

class LoginIn(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=1, max_length=72)

class TokenOut(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"

    athlete_id: Optional[int] = None

class RefreshIn(BaseModel):
    refresh_token: str

class LogoutIn(BaseModel):
    refresh_token: str

class MeOut(BaseModel):
    id: int
    email: EmailStr
    is_active: bool
    is_verified: bool

    class Config:
        from_attributes = True

class LinkAthleteIn(BaseModel):
    athlete_id: int
    role: str = "athlete"
