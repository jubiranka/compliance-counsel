from pydantic import BaseModel, EmailStr
from typing import Optional

# ---------- USER CREATION ----------
class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str
    role: Optional[str] = "USER"

# ---------- USER RESPONSE ----------
class UserOut(BaseModel):
    id: int
    name: str
    email: EmailStr
    role: str

    class Config:
        orm_mode = True

# ---------- LOGIN ----------
class UserLogin(BaseModel):
    email: EmailStr
    password: str

# ---------- TOKEN ----------
class Token(BaseModel):
    access_token: str
    token_type: str
