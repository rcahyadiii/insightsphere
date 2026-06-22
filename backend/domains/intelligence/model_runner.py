"""
Model Runner v2 — Orchestrasi ML Pipeline.
Urutan: StockPredictor (family×4H) → Disaggregator (per-item) → AnomalyDetector → Save all.
"""
import logging
from typing import Any
from sqlalchemy.orm import Session

from domains.intelligence.models import AIPredictionLog
from domains.intelligence.stock_aggressive_predictor import StockAggressivePredictor
from domains.intelligence.disaggregator import DemandDisaggregator
from domains.intelligence.anomaly_detector import AnomalyDetector


def run_daily_ml_batch(db_session: Session) -> dict[str, Any]:
    print("=" * 60)
    print("  Memulai Eksekusi AI ML Batch v2 (Multi-Horizon + Per-Item)")
    print("=" * 60)

    try:
        # ── Stage 1: Family-Level Prediction (4 Horizons) ──
        print("\n📈 Stage 1: StockAggressivePredictor — Family × Store × 4 Horizons (GPU-Acceleration)")
        predictor = StockAggressivePredictor(db_session)
        family_results = predictor.predict_latest()
        print(f"  → {len(family_results)} prediksi family-level siap.\n")

        # ── Stage 2: Per-Item Disaggregation ──
        print("📦 Stage 2: Disaggregator — Distribusi ke Produk Individual")
        disaggregator = DemandDisaggregator(db_session)
        product_results = disaggregator.disaggregate(family_results)
        print(f"  → {len(product_results)} prediksi per-item siap.\n")

        # ── Stage 3: Branch Anomaly Detection ──
        print("🔍 Stage 3: AnomalyDetector — Isolation Forest per Cabang")
        detector = AnomalyDetector(db_session)
        anomaly_results = detector.detect_anomalies()
        print(f"  → {len(anomaly_results)} skor cabang diverifikasi.\n")

        # ── Stage 4: Save All to ai_prediction_logs ──
        all_results = family_results + product_results + anomaly_results

        logs_to_insert = []
        for res in all_results:
            logs_to_insert.append(AIPredictionLog(
                store_nbr=res.get("store_nbr"),
                branch_id=res.get("branch_id"),
                family=res.get("family"),
                predicted_for_date=res.get("predicted_for_date"),
                prediction_type=res.get("prediction_type", "unknown"),
                predicted_value=res.get("predicted_value", 0.0),
                recommended_stock=res.get("recommended_stock"),
                safety_stock_buffer=res.get("safety_stock_buffer"),
                safety_stock_source=res.get("safety_stock_source"),
                reasoning_text=res.get("reasoning_text", ""),
                model_version=res.get("model_version"),
                horizon_days=res.get("horizon_days"),
                product_id=res.get("product_id"),
                prediction_level=res.get("prediction_level"),
            ))

        if logs_to_insert:
            db_session.add_all(logs_to_insert)
            db_session.commit()
            
            n_family = sum(1 for r in all_results if r.get("prediction_level") == "family")
            n_product = sum(1 for r in all_results if r.get("prediction_level") == "product")
            n_anomaly = sum(1 for r in all_results if r.get("prediction_type") == "branch_anomaly")
            
            print(f"✅ Berhasil menyimpan {len(logs_to_insert)} baris ke 'ai_prediction_logs':")
            print(f"   • Family-level : {n_family}")
            print(f"   • Per-item     : {n_product}")
            print(f"   • Anomaly      : {n_anomaly}")

        return {
            "status": "success",
            "total_predictions_saved": len(logs_to_insert),
            "family_predictions": len(family_results),
            "product_predictions": len(product_results),
            "anomaly_scores": len(anomaly_results),
        }

    except Exception as e:
        db_session.rollback()
        print(f"✖ [Fatal Error MLOps]: Gagal mengeksekusi Batch ML → {e}")
        return {"status": "error", "reason": str(e)}


if __name__ == "__main__":
    from core.database import SessionLocal
    db = SessionLocal()
    try:
        run_daily_ml_batch(db)
    finally:
        db.close()
