#!/usr/bin/env bash
set -e

echo "DATABASE_URL=$DATABASE_URL"

# Wait for Postgres to accept connections
python - <<'PY'
import os, time, sys
import psycopg2

dsn = os.environ.get("DATABASE_URL", "")
dsn = dsn.replace("postgresql+psycopg2", "postgresql")

for i in range(60):
    try:
        conn = psycopg2.connect(dsn)
        conn.close()
        print("Database is ready.")
        sys.exit(0)
    except Exception as e:
        print(f"Waiting for database... ({i+1}/60) {e}")
        time.sleep(1)

print("Database never became ready.", file=sys.stderr)
sys.exit(1)
PY

# Run migrations
echo "Running Alembic migrations..."
poetry run alembic upgrade head || { echo "Alembic failed"; exit 1; }

# Limit CPU threads for PyTorch / NumPy to prevent FastAPI crashes
export OMP_NUM_THREADS=1
export OPENBLAS_NUM_THREADS=1
export MKL_NUM_THREADS=1
export VECLIB_MAXIMUM_THREADS=1
export NUMEXPR_NUM_THREADS=1

# Start the API
echo "Starting FastAPI..."
exec poetry run uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
