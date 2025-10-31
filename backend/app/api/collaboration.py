# app/api/collaboration.py
from __future__ import annotations
from datetime import datetime
from typing import Optional, List

from fastapi import APIRouter, Depends, HTTPException, Query, Body
from pydantic import BaseModel, ConfigDict
from sqlalchemy.orm import Session

from app.database import SessionLocal
from app.auth.core import get_current_user
from app import models

from app.models_collab import (
    Collaboration, CollaborationPermission, TargetType,
    CollaborationInvitation, InvitationStatus,
    ComplianceComment,
)
from app.auth.rbac import has_access, role_required


router = APIRouter(prefix="/collab", tags=["Collaboration"])


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# ----------------------------
# Schemas (Pydantic v2)
# ----------------------------
class InviteCreateIn(BaseModel):
    recipient_email: str
    target_type: TargetType
    target_id: int
    requested_permission: CollaborationPermission = CollaborationPermission.VIEW
    message: Optional[str] = None


class InviteOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    token: str
    status: InvitationStatus
    recipient_email: Optional[str]
    target_type: TargetType
    target_id: int
    requested_permission: CollaborationPermission
    created_at: datetime


class CommentIn(BaseModel):
    body: str


class CommentOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    compliance_id: int
    author_user_id: Optional[int]
    body: str
    created_at: datetime


# ----------------------------
# Invitations
# ----------------------------
@router.post("/invitations", response_model=InviteOut)
@role_required(["ADMIN", "USER", "VIEWER"])  # anyone can invite; access enforced at usage time
def create_invitation(
    payload: InviteCreateIn = Body(...),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """Create a new collaboration invitation"""
    # Basic existence check of target
    if payload.target_type == TargetType.COMPANY:
        if not db.query(models.Company).get(payload.target_id):
            raise HTTPException(status_code=404, detail="Company not found")
    else:
        if not db.query(models.Compliance).get(payload.target_id):
            raise HTTPException(status_code=404, detail="Compliance not found")

    inv = CollaborationInvitation(
        sender_user_id=current_user.id,
        recipient_user_id=None,
        recipient_email=(payload.recipient_email or "").strip().lower(),
        target_type=payload.target_type,
        target_id=payload.target_id,
        requested_permission=payload.requested_permission,
        message=payload.message,
        status=InvitationStatus.PENDING,
        created_at=datetime.utcnow(),
    )
    inv.set_token()
    db.add(inv)
    db.commit()
    db.refresh(inv)
    return inv


@router.get("/invitations/mine", response_model=List[InviteOut])
@role_required(["ADMIN", "USER", "VIEWER"])
def list_my_invitations(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
    inbox: bool = Query(True, description="True = invitations sent to me; False = sent by me"),
):
    """List invitations sent by or received by the user"""
    if inbox:
        q = db.query(CollaborationInvitation).filter(
            CollaborationInvitation.status == InvitationStatus.PENDING,
        ).filter(
            (CollaborationInvitation.recipient_user_id == current_user.id)
            | (CollaborationInvitation.recipient_email == (current_user.email or "").lower())
        )
    else:
        q = db.query(CollaborationInvitation).filter(
            CollaborationInvitation.sender_user_id == current_user.id
        )
    return q.order_by(CollaborationInvitation.created_at.desc()).all()


@router.post("/invitations/{token}/accept", response_model=InviteOut)
@role_required(["ADMIN", "USER", "VIEWER"])
def accept_invitation(
    token: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """Accept a collaboration invitation"""
    inv = db.query(CollaborationInvitation).filter(CollaborationInvitation.token == token).first()
    if not inv or inv.status != InvitationStatus.PENDING:
        raise HTTPException(status_code=404, detail="Invitation not found or not pending")

    if inv.recipient_user_id and inv.recipient_user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Invitation not intended for this user")
    if inv.recipient_email and inv.recipient_email.lower() != (current_user.email or "").lower():
        raise HTTPException(status_code=403, detail="Email mismatch for this invitation")

    inv.recipient_user_id = current_user.id
    inv.status = InvitationStatus.ACCEPTED
    inv.responded_at = datetime.utcnow()

    existing = (
        db.query(Collaboration)
        .filter(
            Collaboration.user_id == current_user.id,
            Collaboration.target_type == inv.target_type,
            Collaboration.target_id == inv.target_id,
        ).first()
    )
    if existing:
        if existing.permission == CollaborationPermission.VIEW and inv.requested_permission == CollaborationPermission.EDIT:
            existing.permission = CollaborationPermission.EDIT
    else:
        link = Collaboration(
            user_id=current_user.id,
            target_type=inv.target_type,
            target_id=inv.target_id,
            permission=inv.requested_permission,
        )
        db.add(link)

    db.commit()
    db.refresh(inv)
    return inv


@router.post("/invitations/{token}/decline", response_model=InviteOut)
@role_required(["ADMIN", "USER", "VIEWER"])
def decline_invitation(
    token: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """Decline a collaboration invitation"""
    inv = db.query(CollaborationInvitation).filter(CollaborationInvitation.token == token).first()
    if not inv or inv.status != InvitationStatus.PENDING:
        raise HTTPException(status_code=404, detail="Invitation not found or not pending")

    if inv.recipient_user_id and inv.recipient_user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Invitation not intended for this user")
    if inv.recipient_email and inv.recipient_email.lower() != (current_user.email or "").lower():
        raise HTTPException(status_code=403, detail="Email mismatch for this invitation")

    inv.status = InvitationStatus.DECLINED
    inv.responded_at = datetime.utcnow()
    db.commit()
    db.refresh(inv)
    return inv


# ----------------------------
# Collaborators listing
# ----------------------------
@router.get("/compliances/{compliance_id}/collaborators")
@role_required(["ADMIN", "USER", "VIEWER"])
def list_collaborators_for_compliance(
    compliance_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """List collaborators for a specific compliance"""
    if not has_access(db, current_user, TargetType.COMPLIANCE, compliance_id, CollaborationPermission.VIEW):
        raise HTTPException(status_code=403, detail="No access to this compliance")

    links = (
        db.query(Collaboration)
        .filter(
            Collaboration.target_type == TargetType.COMPLIANCE,
            Collaboration.target_id == compliance_id,
        ).all()
    )
    users = []
    for l in links:
        u = db.query(models.User).get(l.user_id)
        if u:
            users.append({
                "user_id": u.id,
                "name": u.name,
                "email": u.email,
                "permission": l.permission.value,
            })
    return {"compliance_id": compliance_id, "collaborators": users}


# ----------------------------
# Comments (collaborative discussion thread)
# ----------------------------
@router.post("/compliances/{compliance_id}/comments", response_model=CommentOut)
@role_required(["ADMIN", "USER", "VIEWER"])
def add_comment(
    compliance_id: int,
    payload: CommentIn = Body(...),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """Add a comment to a compliance"""
    if not has_access(db, current_user, TargetType.COMPLIANCE, compliance_id, CollaborationPermission.VIEW):
        raise HTTPException(status_code=403, detail="No access to this compliance")

    if not db.query(models.Compliance).get(compliance_id):
        raise HTTPException(status_code=404, detail="Compliance not found")

    c = ComplianceComment(
        compliance_id=compliance_id,
        author_user_id=current_user.id,
        body=(payload.body or "").strip(),
    )
    db.add(c)
    db.commit()
    db.refresh(c)
    return c


@router.get("/compliances/{compliance_id}/comments", response_model=List[CommentOut])
@role_required(["ADMIN", "USER", "VIEWER"])
def get_comments(
    compliance_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """Fetch comments for a compliance"""
    if not has_access(db, current_user, TargetType.COMPLIANCE, compliance_id, CollaborationPermission.VIEW):
        raise HTTPException(status_code=403, detail="No access to this compliance")

    return (
        db.query(ComplianceComment)
        .filter(ComplianceComment.compliance_id == compliance_id)
        .order_by(ComplianceComment.created_at.asc())
        .all()
    )
