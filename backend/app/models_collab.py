# app/models_collab.py
from __future__ import annotations
from datetime import datetime
import enum
import uuid

from sqlalchemy import (
    Column, Integer, String, DateTime, ForeignKey, Enum, Text, UniqueConstraint, Index
)
from sqlalchemy.orm import relationship
from app.database import Base


# -------------------------------------------------------------------
# Enums (do NOT affect your user role enums)
# -------------------------------------------------------------------
class TargetType(str, enum.Enum):
    COMPANY = "COMPANY"
    COMPLIANCE = "COMPLIANCE"


class CollaborationPermission(str, enum.Enum):
    VIEW = "VIEW"
    EDIT = "EDIT"


class InvitationStatus(str, enum.Enum):
    PENDING = "PENDING"
    ACCEPTED = "ACCEPTED"
    DECLINED = "DECLINED"
    EXPIRED = "EXPIRED"


# -------------------------------------------------------------------
# Collab link: grants access without changing base role
# -------------------------------------------------------------------
class Collaboration(Base):
    __tablename__ = "collaborations"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    target_type = Column(Enum(TargetType, name="collab_target_type_enum"), nullable=False, index=True)
    target_id = Column(Integer, nullable=False, index=True)
    permission = Column(Enum(CollaborationPermission, name="collab_permission_enum"), nullable=False, default=CollaborationPermission.VIEW)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)

    # Optional uniqueness: same user cannot have duplicate link
    __table_args__ = (
        UniqueConstraint("user_id", "target_type", "target_id", name="uq_user_target"),
        Index("ix_collab_target", "target_type", "target_id"),
    )


# -------------------------------------------------------------------
# Invitation flow: user -> user (email), then accept/decline by token
# -------------------------------------------------------------------
class CollaborationInvitation(Base):
    __tablename__ = "collab_invitations"

    id = Column(Integer, primary_key=True)
    token = Column(String(64), unique=True, nullable=False, index=True)

    sender_user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    recipient_user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    recipient_email = Column(String(255), nullable=True, index=True)

    target_type = Column(Enum(TargetType, name="inv_target_type_enum"), nullable=False)
    target_id = Column(Integer, nullable=False)

    requested_permission = Column(Enum(CollaborationPermission, name="inv_permission_enum"), nullable=False, default=CollaborationPermission.VIEW)
    status = Column(Enum(InvitationStatus, name="inv_status_enum"), nullable=False, default=InvitationStatus.PENDING)

    message = Column(Text)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)
    responded_at = Column(DateTime(timezone=True), nullable=True)

    def set_token(self):
        self.token = uuid.uuid4().hex


# -------------------------------------------------------------------
# Commenting on compliances (collaborative discussion)
# -------------------------------------------------------------------
class ComplianceComment(Base):
    __tablename__ = "compliance_comments"

    id = Column(Integer, primary_key=True)
    compliance_id = Column(Integer, ForeignKey("compliances.id", ondelete="CASCADE"), nullable=False, index=True)
    author_user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    body = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)

    Index("ix_comment_compliance", "compliance_id")
