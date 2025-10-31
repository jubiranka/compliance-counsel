from sqlalchemy import (
    Column,
    Integer,
    String,
    Enum,
    Text,
    Date,
    DateTime,
    ForeignKey,
    Float,
    BigInteger,
    func,
    JSON,
    Index
)
from sqlalchemy.orm import relationship
from app.database import Base
import enum
from sqlalchemy.dialects import postgresql

# ---------------------------------------------------------
# ENUMS
# ---------------------------------------------------------
class UserRole(str, enum.Enum):
    ADMIN = "ADMIN"
    USER = "USER"
    VIEWER = "VIEWER"


class ComplianceStatus(str, enum.Enum):
    PENDING = "PENDING"
    COMPLETED = "COMPLETED"
    OVERDUE = "OVERDUE"


# ---------------------------------------------------------
# USERS
# ---------------------------------------------------------
class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    email = Column(String(255), unique=True, nullable=False)
    role = Column(Enum(UserRole, name="user_role_enum"), default=UserRole.USER, nullable=False)
    password_hash = Column(String(255))
    company_name = Column(String(255))
    designation = Column(String(255))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    audit_logs = relationship("AuditLog", back_populates="user")


# ---------------------------------------------------------
# COMPANIES
# ---------------------------------------------------------
class Company(Base):
    __tablename__ = "companies"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    cin_number = Column(String(50), unique=True)
    industry_type = Column(String(100))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    status = Column(String(50))
    industry = Column(String(100))
    authorized_capital = Column(BigInteger)
    paid_up_capital = Column(BigInteger)
    address = Column(Text)
    registration_date = Column(Date)
    director_name = Column(String(255))
    director_email = Column(String(255))
    company_secretary = Column(String(255))
    auditor_name = Column(String(255))
    notes = Column(Text)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    compliances = relationship("Compliance", back_populates="company")


# ---------------------------------------------------------
# ACTS
# ---------------------------------------------------------
class Act(Base):
    __tablename__ = "acts"

    id = Column(Integer, primary_key=True)
    name = Column(String(255), unique=True, nullable=False)
    description = Column(Text)

    sections = relationship("Section", back_populates="act")
    rules = relationship("Rule", back_populates="act")
    compliances = relationship("Compliance", back_populates="act")


# ---------------------------------------------------------
# SECTIONS
# ---------------------------------------------------------
class Section(Base):
    __tablename__ = "sections"

    id = Column(Integer, primary_key=True)
    section_number = Column(String(50), nullable=False)
    description = Column(Text)
    act_id = Column(Integer, ForeignKey("acts.id"))

    act = relationship("Act", back_populates="sections")
    compliances = relationship("Compliance", back_populates="section")
    penalties = relationship("Penalty", back_populates="section")


# ---------------------------------------------------------
# RULES
# ---------------------------------------------------------
class Rule(Base):
    __tablename__ = "rules"

    id = Column(Integer, primary_key=True)
    rule_number = Column(String(50), nullable=False)
    description = Column(Text)
    act_id = Column(Integer, ForeignKey("acts.id"))

    act = relationship("Act", back_populates="rules")
    compliances = relationship("Compliance", back_populates="rule")


# ---------------------------------------------------------
# FORMS
# ---------------------------------------------------------
class Form(Base):
    __tablename__ = "forms"

    id = Column(Integer, primary_key=True)
    form_name = Column(String(100), nullable=False)
    purpose = Column(Text)
    due_days = Column(Integer)

    compliances = relationship("Compliance", back_populates="form")


# ---------------------------------------------------------
# PENALTIES
# ---------------------------------------------------------
class Penalty(Base):
    __tablename__ = "penalties"

    id = Column(Integer, primary_key=True)
    section_id = Column(Integer, ForeignKey("sections.id"))
    amount = Column(Float)
    remarks = Column(Text)

    section = relationship("Section", back_populates="penalties")


# ---------------------------------------------------------
# ✅ COMPLIANCES (MIRRORS DB SCHEMA)
# ---------------------------------------------------------
class Compliance(Base):
    __tablename__ = "compliances"

    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id", ondelete="CASCADE"), index=True, nullable=True)
    act_id = Column(Integer, ForeignKey("acts.id", ondelete="SET NULL"), index=True, nullable=True)
    section_id = Column(Integer, ForeignKey("sections.id", ondelete="SET NULL"), index=True, nullable=True)
    rule_id = Column(Integer, ForeignKey("rules.id", ondelete="SET NULL"), index=True, nullable=True)
    form_id = Column(Integer, ForeignKey("forms.id", ondelete="SET NULL"), index=True, nullable=True)

    due_date = Column(Date, nullable=True)
    status = Column(Enum(ComplianceStatus, name="compliance_status_enum"), nullable=True)

    remarks = Column(Text, nullable=True)
    verified_status = Column(String(50), nullable=True)
    verified_by = Column(String(255), nullable=True)
    verified_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    company = relationship("Company", back_populates="compliances")
    act = relationship("Act", back_populates="compliances")
    section = relationship("Section", back_populates="compliances")
    rule = relationship("Rule", back_populates="compliances")
    form = relationship("Form", back_populates="compliances")


# ---------------------------------------------------------
# EVENTS
# ---------------------------------------------------------
class Event(Base):
    __tablename__ = "events"

    id = Column(Integer, primary_key=True)
    event_name = Column(String(255), nullable=False)
    trigger_date = Column(Date)
    related_compliance_id = Column(Integer, ForeignKey("compliances.id"))

    related_compliance = relationship("Compliance")


# ---------------------------------------------------------
# NOTIFICATIONS
# ---------------------------------------------------------
class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True)
    title = Column(String(255), nullable=False)
    source_url = Column(String(255))
    published_on = Column(Date)
    category = Column(String(100))
    scraped_on = Column(DateTime(timezone=True), server_default=func.now())


# ---------------------------------------------------------
# AUDIT LOG
# ---------------------------------------------------------
class AuditLog(Base):
    __tablename__ = "audit_log"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    action = Column(String(255))
    timestamp = Column(DateTime(timezone=True), server_default=func.now())
    details = Column(Text)

    user = relationship("User", back_populates="audit_logs")


# ---------------------------------------------------------
# INGESTION LOG
# ---------------------------------------------------------
class IngestionLog(Base):
    __tablename__ = "ingestion_log"

    id = Column(Integer, primary_key=True)
    filename = Column(String(255), nullable=False)
    sha256 = Column(String(64), unique=True, nullable=False)
    status = Column(String(32), nullable=False)
    act_name = Column(String(255))
    message = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


# ---------------------------------------------------------
# COMPLIANCE ASSISTANT DOCUMENTS
# ---------------------------------------------------------
class CSDocument(Base):
    __tablename__ = "cs_documents"

    id = Column(Integer, primary_key=True)
    title = Column(String(255), nullable=False)
    source_type = Column(String(64))
    source_url = Column(String(255))
    issued_by = Column(String(128))
    issued_on = Column(Date)
    authority = Column(String(128))
    act_id = Column(Integer, ForeignKey("acts.id"), nullable=True)
    section_id = Column(Integer, ForeignKey("sections.id"), nullable=True)
    rule_id = Column(Integer, ForeignKey("rules.id"), nullable=True)
    form_id = Column(Integer, ForeignKey("forms.id"), nullable=True)
    content = Column(Text, nullable=False)
    meta_data = Column(JSON)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    vectors = relationship("CSVector", back_populates="document")


# ---------------------------------------------------------
# COMPLIANCE ASSISTANT VECTORS
# ---------------------------------------------------------
class CSVector(Base):
    __tablename__ = "cs_vectors"

    id = Column(Integer, primary_key=True)
    document_id = Column(Integer, ForeignKey("cs_documents.id", ondelete="CASCADE"))
    chunk_index = Column(Integer, nullable=False)
    chunk_text = Column(Text, nullable=False)
    embedding = Column(postgresql.ARRAY(Float))
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    document = relationship("CSDocument", back_populates="vectors")
