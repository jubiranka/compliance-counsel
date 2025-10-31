from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from ..database import SessionLocal
from .. import models

router = APIRouter(prefix="/users", tags=["Users"])

# Dependency – get DB session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# ---------------------------------------------------------
# CREATE
# ---------------------------------------------------------
@router.post("/")
def create_user(name: str, email: str, role: models.UserRole = models.UserRole.USER, db: Session = Depends(get_db)):
    """Create a new user"""
    existing = db.query(models.User).filter(models.User.email == email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    new_user = models.User(name=name, email=email, role=role)
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return {"message": "User created successfully", "user": new_user}

# ---------------------------------------------------------
# READ – all users
# ---------------------------------------------------------
@router.get("/", response_model=List[dict])
def get_users(db: Session = Depends(get_db)):
    """Get all users"""
    users = db.query(models.User).all()
    return [{"id": u.id, "name": u.name, "email": u.email, "role": u.role} for u in users]

# ---------------------------------------------------------
# READ – one user
# ---------------------------------------------------------
@router.get("/{user_id}")
def get_user(user_id: int, db: Session = Depends(get_db)):
    """Get user by ID"""
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return {
        "id": user.id,
        "name": user.name,
        "email": user.email,
        "role": user.role,
        "created_at": user.created_at,
    }

# ---------------------------------------------------------
# UPDATE
# ---------------------------------------------------------
@router.put("/{user_id}")
def update_user(user_id: int, name: str = None, role: models.UserRole = None, db: Session = Depends(get_db)):
    """Update user details"""
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if name:
        user.name = name
    if role:
        user.role = role

    db.commit()
    db.refresh(user)
    return {"message": "User updated", "user": user}

# ---------------------------------------------------------
# DELETE
# ---------------------------------------------------------
@router.delete("/{user_id}")
def delete_user(user_id: int, db: Session = Depends(get_db)):
    """Delete user"""
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    db.delete(user)
    db.commit()
    return {"message": f"User with id={user_id} deleted"}
