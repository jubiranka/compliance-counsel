# app/auth/roles.py
from fastapi import Depends, HTTPException, status
from app.auth import get_current_user
from app import models

def require_role(*allowed_roles: str):
    """
    Use: Depends(require_role("ADMIN")) or ("ADMIN","USER")
    """
    def _checker(user: models.User = Depends(get_current_user)):
        if user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Forbidden: insufficient role"
            )
        return user
    return _checker
