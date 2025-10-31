from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from dotenv import load_dotenv
import os
import socket

# ---------------------------------------------------------
# Load environment variables
# ---------------------------------------------------------
load_dotenv()

# ---------------------------------------------------------
# Smart DB Host Resolver
# ---------------------------------------------------------
# Detect if we're running inside Docker (hostname "db" reachable)
def resolve_db_url() -> str:
    # Get DB URL from .env or fallback
    env_url = os.getenv("DATABASE_URL", "").strip()
    if env_url:
        # If "db" in URL but not reachable, fallback to localhost
        if "@db:" in env_url:
            try:
                socket.gethostbyname("db")
            except socket.error:
                # Replace 'db' with 'localhost'
                env_url = env_url.replace("@db:", "@localhost:")
        return env_url

    # Default fallback (for local runs)
    return "postgresql+psycopg2://postgres:password123@localhost:5432/compliance_counsel"


# ---------------------------------------------------------
# Create SQLAlchemy Engine & Session
# ---------------------------------------------------------
DATABASE_URL = resolve_db_url()
engine = create_engine(DATABASE_URL, pool_pre_ping=True)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


# ---------------------------------------------------------
# DB Session Dependency for FastAPI routes
# ---------------------------------------------------------
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
