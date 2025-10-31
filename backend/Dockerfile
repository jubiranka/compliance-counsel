# -----------------------------------------------------------
# 🐍 Base Image
# -----------------------------------------------------------
FROM python:3.13-slim

WORKDIR /app

# -----------------------------------------------------------
# 🔧 Install system dependencies (Postgres, bcrypt, reportlab, etc.)
# -----------------------------------------------------------
RUN apt-get update && apt-get install -y \
    build-essential \
    libpq-dev \
    gcc \
    python3-dev \
    curl \
    libjpeg-dev \
    zlib1g-dev \
    libfreetype6-dev \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

# -----------------------------------------------------------
# 🧩 Install Poetry
# -----------------------------------------------------------
RUN pip install --no-cache-dir poetry==1.8.3

# -----------------------------------------------------------
# 📦 Copy dependency manifests first (for build caching)
# -----------------------------------------------------------
COPY pyproject.toml poetry.lock* /app/

# -----------------------------------------------------------
# 🧰 Configure Poetry (disable venv, install deps)
# -----------------------------------------------------------
RUN poetry config virtualenvs.create false \
    && poetry install --no-interaction --no-ansi --no-root

# -----------------------------------------------------------
# 🔒 Install additional runtime + AI libraries
# -----------------------------------------------------------
RUN pip install --no-cache-dir \
    bcrypt \
    passlib[bcrypt] \
    python-jose[cryptography] \
    python-multipart \
    PyPDF2 \
    pandas \
    requests \
    numpy \
    tqdm \
    loguru \
    pypdf \
    sentence-transformers \
    duckduckgo-search

# -----------------------------------------------------------
# 🚀 Copy application source code
# -----------------------------------------------------------
COPY . /app

# -----------------------------------------------------------
# ⚙️ Permissions and entrypoint
# -----------------------------------------------------------
RUN chmod +x /app/start.sh
ENV PYTHONUNBUFFERED=1

# -----------------------------------------------------------
# 🏃 Run backend (FastAPI + Scheduler)
# -----------------------------------------------------------
CMD ["bash", "/app/start.sh"]
