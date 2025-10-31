# app/auth/rbac.py
from __future__ import annotations
from functools import wraps
from typing import Callable, Iterable, Optional

from fastapi import Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.auth.core import get_current_user

from app.database import SessionLocal
from app import models
from app.models_collab import Collaboration, TargetType, CollaborationPermission


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def role_required(allowed: Iterable[str]):
    """
    Decorator to enforce base role (ADMIN/USER/VIEWER).
    Collaboration grants resource access, but base role still applies to *which endpoints* you can call.
    """
    allowed_set = set(allowed)

    def decorator(fn: Callable):
        @wraps(fn)
        def wrapper(*args, current_user: models.User = Depends(get_current_user), **kwargs):
            if (current_user.role or "").upper() not in allowed_set:
                raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Insufficient role")
            return fn(*args, current_user=current_user, **kwargs)
        return wrapper
    return decorator


def has_access(
    db: Session,
    user: models.User,
    target_type: TargetType,
    target_id: int,
    needed: CollaborationPermission = CollaborationPermission.VIEW,
) -> bool:
    """
    ADMIN => always true
    Otherwise check collaboration link:
      - direct compliance
      - via company on compliance (if provided)
    """
    if (user.role or "").upper() == "ADMIN":
        return True

    # 1) Direct match (user has a collab entry for that resource)
    link = (
        db.query(Collaboration)
        .filter(
            Collaboration.user_id == user.id,
            Collaboration.target_type == target_type,
            Collaboration.target_id == target_id,
        )
        .first()
    )
    if link:
        if link.permission == CollaborationPermission.EDIT:
            return True
        return needed == CollaborationPermission.VIEW

    # 2) If target is a COMPLIANCE, also check company-level access
    if target_type == TargetType.COMPLIANCE:
        comp = db.query(models.Compliance).get(target_id)
        if comp and comp.company_id:
            link2 = (
                db.query(Collaboration)
                .filter(
                    Collaboration.user_id == user.id,
                    Collaboration.target_type == TargetType.COMPANY,
                    Collaboration.target_id == comp.company_id,
                )
                .first()
            )
            if link2:
                if link2.permission == CollaborationPermission.EDIT:
                    return True
                return needed == CollaborationPermission.VIEW

    return False
