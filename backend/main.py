import logging
import os
from typing import cast

from celery import Task
from sqlalchemy import text
from fastapi import FastAPI, Depends, BackgroundTasks, Request, Response
from contextlib import asynccontextmanager
from apscheduler.schedulers.asyncio import AsyncIOScheduler

from core.database import engine, Base, get_db

# Import SEMUA domain models agar SQLAlchemy mendaftarkan tabel-tabelnya
from domains.dataset import models as _dataset
from domains.observability import models as _observability
from domains.identity import models as _identity
from domains.sales import models as _sales
from domains.finance import models as _finance
from domains.intelligence import models as _intelligence
from domains.inventory import models as _inventory
from domains.notification import models as _notification
from domains.reporting import models as _reporting
from domains.branches import models as _branches

# 1. Konfigurasi Sistem Logging
is_vercel = os.getenv("VERCEL") == "1"

handlers: list[logging.Handler] = [logging.StreamHandler()]
if not is_vercel:
    try:
        # 5 MB rotation, 5 backup → ~25 MB ceiling untuk system_api.log* sebelum overwrite.
        from logging.handlers import RotatingFileHandler
        handlers.append(
            RotatingFileHandler(
                "system_api.log",
                maxBytes=5 * 1024 * 1024,
                backupCount=5,
                encoding="utf-8",
            )
        )
    except Exception:
        pass

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    handlers=handlers
)
logger = logging.getLogger("SystemHealth")


# ==========================================
# Background Tasks (Celery & Worker)
# ==========================================
from domains.intelligence.tasks import ml_daily_batch_task
from core.redis_health import should_skip_enqueue

def trigger_ml_batch_task():
    """
    Trigger task ML di Celery Worker alih-alih di proses utama.

    Dev guard: kalau Redis tidak reachable di non-production, skip enqueue
    dan log warning sekali (warn-once) di `core.redis_health`.
    """
    if should_skip_enqueue():
        return
    try:
        # Mengirimkan pekerjaan ke Redis queue (Non-blocking)
        cast(Task, ml_daily_batch_task).delay()
        logger.info("[Scheduler] ML Batch Task has been queued to Celery.")
    except Exception as e:
        logger.error(f"[Scheduler Error] Failed to queue ML task: {e}")

# 2. Konfigurasi Lifespan (Startup/Shutdown Event Modern)
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Jika di Vercel, kita matikan Scheduler internal.
    # Tanggung jawab scheduler akan pindah ke Hugging Face Worker (Always-on).
    if is_vercel:
        logger.info("[Lifespan] Vercel environment detected. Internal Scheduler disabled.")
        yield
        return

    scheduler = AsyncIOScheduler()
    
    # Environment Variable Switching (Dev vs Prod)
    dev_interval_sec = os.getenv("ANALYTICS_INTERVAL_SECONDS")
    
    if dev_interval_sec:
        # Development Mode
        scheduler.add_job(
            trigger_ml_batch_task, 
            'interval', 
            seconds=int(dev_interval_sec), 
            misfire_grace_time=3600, 
            id='mlops_batch_dev'
        )
        logger.info(f"[Job Scheduler] DEV MODE: MLOps Analytics terjadwal setiap {dev_interval_sec} detik.")
    else:
        # Production Mode
        scheduler.add_job(
            trigger_ml_batch_task, 
            'cron', 
            hour=0, 
            minute=0, 
            misfire_grace_time=3600, 
            id='mlops_batch_prod'
        )
        logger.info("[Job Scheduler] PROD MODE: MLOps Analytics terjadwal secara kronologis setiap pukul 00:00 (Tengah Malam).")
        
    # DB healthcheck setiap 60 detik — catat audit DB_HEALTH_FAIL kalau gagal.
    from core.health_monitor import db_healthcheck_tick
    scheduler.add_job(
        db_healthcheck_tick,
        'interval',
        seconds=60,
        next_run_time=None,
        misfire_grace_time=30,
        id='db_healthcheck',
    )
    logger.info("[Job Scheduler] DB healthcheck terjadwal tiap 60 detik.")

    scheduler.start()
    yield
    scheduler.shutdown()
    logger.info("[Job Scheduler] Saraf memori Cron dibersihkan secara elegan (Graceful Shutdown).")

# 3. Inisialisasi Aplikasi Utama
from core.mirror_middleware import MirrorReadOnlyMiddleware
from core.rate_limit import limiter
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware
app = FastAPI(
    title="InsightSphere API",
    description="ERP Backend berbasis Domain-Driven Design dengan XAI & MLOps Pipeline",
    version="2.0.0",
    lifespan=lifespan
)

@app.get("/health", tags=["Observability"])
def health_check(db = Depends(get_db)):
    """ Endpoint Observabilitas untuk Container Orchestration (Docker/Kubernetes). """
    try:
        db.execute(text("SELECT 1"))
        logger.info("Health check berhasil: API dan Database terkoneksi.")
        return {"api": "healthy", "database": "connected"}
    except Exception as e:
        logger.error(f"Health check gagal! Database terputus. Reason: {e}")
        return {"api": "healthy", "database": "disconnected", "error": str(e)}

# 4. Registrasi Router dari setiap Domain
from domains.sales.router import router as sales_router
from domains.finance.router import router as finance_router
from domains.intelligence.router import router as intelligence_router
from domains.inventory.router import router as inventory_router
from domains.identity.router import router as identity_router
from domains.dataset.router import router as dataset_router
from domains.notification.routes import router as notification_router
from domains.reporting.router import router as reporting_router
from domains.dashboard.router import router as dashboard_router
from domains.branches.router import router as branches_router

app.include_router(sales_router)
app.include_router(finance_router)
app.include_router(intelligence_router, prefix="/api/analytics", tags=["Intelligence"])
app.include_router(inventory_router)
app.include_router(identity_router)
app.include_router(dataset_router)
app.include_router(notification_router)
app.include_router(reporting_router)
app.include_router(dashboard_router)
app.include_router(branches_router)

app.state.limiter = limiter


def rate_limit_exceeded_handler(request: Request, exc: Exception) -> Response:
    if not isinstance(exc, RateLimitExceeded):
        raise exc
    return _rate_limit_exceeded_handler(request, exc)


app.add_exception_handler(RateLimitExceeded, rate_limit_exceeded_handler)
app.add_middleware(SlowAPIMiddleware)
app.add_middleware(MirrorReadOnlyMiddleware)

@app.get("/")
def read_root():
    return {"message": "InsightSphere API v2.0 — Domain-Driven Design. Welcome!"}

@app.post("/api/ml/run-daily-batch", tags=["MLOps"])
def run_daily_batch(background_tasks: BackgroundTasks):
    """
    Trigger kalkulasi AI Manual via HTTP.
    Berjalan via BackgroundTasks untuk mengakomodir jika admin ingin memaksa eksekusi.
    """
    background_tasks.add_task(ml_daily_batch_task)
    return {"status": "Batch ML process started in background via API Trigger"}
from fastapi.responses import JSONResponse


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(
        "Unhandled exception while processing %s %s",
        request.method,
        request.url.path,
        exc_info=(type(exc), exc, exc.__traceback__),
    )
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error"},
    )
