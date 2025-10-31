# app/ingest/scheduler.py
"""
APScheduler Job Scheduler ✅ FINAL
---------------------------------
Runs daily ingestion job at 3:00 AM IST to detect and process new PDFs.
Uses BackgroundScheduler (safe inside FastAPI).
"""

from __future__ import annotations
from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger
from zoneinfo import ZoneInfo
from datetime import datetime
import sys
from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.ingest.pipeline_db import extract_all_new

# Global scheduler instance
_scheduler: BackgroundScheduler | None = None


def _job_extract_new():
    """Daily extraction job"""
    db: Session = SessionLocal()
    try:
        print(f"🕒 [{datetime.now()}] [Scheduler] Running daily PDF extraction job...", flush=True)
        extract_all_new(db)
        print("✅ [Scheduler] Completed ingestion cycle.", flush=True)
    except Exception as e:
        print(f"❌ [Scheduler] Failed ingestion cycle: {e}", flush=True)
    finally:
        db.close()
        sys.stdout.flush()


def start_scheduler():
    """Start daily extraction job at 3:00 AM IST"""
    global _scheduler
    if _scheduler and _scheduler.running:
        print("ℹ️ Scheduler already running.", flush=True)
        return _scheduler

    _scheduler = BackgroundScheduler(timezone=ZoneInfo("Asia/Kolkata"))
    trigger = CronTrigger(hour=3, minute=0)
    _scheduler.add_job(_job_extract_new, trigger, id="daily_extract_job", replace_existing=True)
    _scheduler.start()
    print("🚀 Scheduler started: Daily extraction job set for 03:00 AM IST", flush=True)
    sys.stdout.flush()
    return _scheduler


def shutdown_scheduler():
    """Gracefully stop scheduler on app shutdown"""
    global _scheduler
    if _scheduler and _scheduler.running:
        _scheduler.shutdown(wait=False)
        print("🛑 Scheduler stopped.", flush=True)
        sys.stdout.flush()
        _scheduler = None


def get_status():
    """Return scheduler runtime status"""
    if not _scheduler:
        return {"running": False, "jobs": []}
    jobs = _scheduler.get_jobs()
    return {
        "running": _scheduler.running,
        "jobs": [
            {
                "id": j.id,
                "next_run": str(j.next_run_time),
                "trigger": str(j.trigger),
            }
            for j in jobs
        ],
    }
