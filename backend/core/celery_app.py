from celery import Celery
from core.config import settings

celery_app = Celery(
    "insightsphere",
    broker=settings.REDIS_URL,
    backend=settings.REDIS_URL,
    include=["domains.intelligence.tasks"]
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    task_track_started=True,
    # Menghindari zombie process atau memory leak pada task ML yang berat
    worker_max_tasks_per_child=10,
)
