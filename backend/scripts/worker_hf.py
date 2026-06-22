import os
import subprocess
import logging
import threading
import uvicorn
from fastapi import FastAPI
from apscheduler.schedulers.background import BackgroundScheduler
from domains.intelligence.tasks import ml_daily_batch_task

# 1. Setup Logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("HF-Worker-Monitor")

app = FastAPI(title="InsightSphere HF Worker Monitor")

@app.get("/")
def health():
    return {
        "status": "active", 
        "service": "Celery Worker + Scheduler",
        "redis_connected": os.getenv("REDIS_URL") is not None
    }

def run_celery_worker():
    """ Menjalankan proses Celery Worker """
    logger.info("Starting Celery Worker...")
    # Menggunakan perintah yang sama dengan docker-compose
    subprocess.run(["celery", "-A", "core.celery_app", "worker", "--loglevel=info"])

def start_scheduler():
    """ Menjalankan APScheduler untuk memicu task ke Redis """
    scheduler = BackgroundScheduler()
    
    # Trigger task ML setiap hari pukul 00:00
    scheduler.add_job(
        lambda: ml_daily_batch_task.delay(), 
        'cron', 
        hour=0, 
        minute=0, 
        id='ml_daily_prod'
    )
    
    # Untuk testing: Jika ada env var khusus, jalankan setiap X detik
    test_interval = os.getenv("ANALYTICS_INTERVAL_SECONDS")
    if test_interval:
        scheduler.add_job(
            lambda: ml_daily_batch_task.delay(), 
            'interval', 
            seconds=int(test_interval),
            id='ml_test_interval'
        )
        logger.info(f"Scheduler: Test mode active, interval {test_interval}s")
    
    scheduler.start()
    logger.info("APScheduler started inside HF Worker.")

if __name__ == "__main__":
    # 1. Jalankan Scheduler
    start_scheduler()
    
    # 2. Jalankan Celery Worker di thread terpisah agar tidak blocking
    worker_thread = threading.Thread(target=run_celery_worker, daemon=True)
    worker_thread.start()
    
    # 3. Jalankan Health Check Web Server di port 7860 (Wajib bagi Hugging Face)
    port = int(os.getenv("PORT", 7860))
    uvicorn.run(app, host="0.0.0.0", port=port)
