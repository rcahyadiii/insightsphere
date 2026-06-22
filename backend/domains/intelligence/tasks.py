from core.celery_app import celery_app
from core.database import SessionLocal
import logging

logger = logging.getLogger("MLWorker")

@celery_app.task(name="domains.intelligence.tasks.ml_daily_batch")
def ml_daily_batch_task():
    """
    Menjalankan proses Feature Engineering dan Model Runner secara asynchronous.
    Dijalankan di Celery Worker.
    """
    try:
        from domains.intelligence.feature_engineering import generate_big_data_features
        from domains.intelligence.model_runner import run_daily_ml_batch
        
        logger.info("[Celery] Starting Daily ML Batch Process...")
        
        # 1. Feature Engineering
        generate_big_data_features()
        
        # 2. Model Training/Prediction
        db = SessionLocal()
        try:
            run_daily_ml_batch(db)
        finally:
            db.close()
            
        logger.info("[Celery] Daily ML Batch completed successfully!")
        return {"status": "success", "message": "Daily ML Batch completed"}
        
    except Exception as e:
        logger.error(f"[Celery Error] Batch analysis failed: {str(e)}")
        # Raise exception agar Celery bisa me-retry jika dikonfigurasi
        raise e
