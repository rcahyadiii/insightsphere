"""
StockPredictor v10 — Aggressive Multi-Horizon Ensemble.
Dual-model ensemble (Huber + Tweedie) + Isotonic bias calibration.
24 fitur input, 4 horizon output.
"""
import pandas as pd
import xgboost as xgb
import shap
import os
import joblib
import numpy as np
from sqlalchemy import select
from sqlalchemy.orm import Session
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional
from sklearn.isotonic import IsotonicRegression
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score

from domains.intelligence.stock_predictor_config import (
    DEFAULT_SAFETY_STOCK_QUANTILE,
    DEFAULT_TRAINING_SAMPLE_LIMIT,
    ENSEMBLE_MODEL_WEIGHT,
    MAX_SAFETY_STOCK_QUANTILE,
    MIN_ERROR_BUFFER_SEGMENT_SIZE,
    MIN_SAFETY_STOCK_QUANTILE,
    MODEL_ARTIFACTS_DIR,
    SHAP_EXPLAINER_HORIZON,
    STOCK_CATEGORICAL_FEATURES,
    STOCK_FEATURE_COLUMNS,
    STOCK_HUBER_PARAMS,
    STOCK_PREDICTOR_HORIZONS,
    STOCK_TWEEDIE_PARAMS,
    TARGET_CLIP_QUANTILE,
    TRAIN_TEST_SPLIT_RATIO,
)
from domains.intelligence.models import MLFeatureStore, AIModelMetric


class SklearnCompatibleXGBRegressor(xgb.XGBRegressor):
    def __sklearn_tags__(self):
        tags = super().__sklearn_tags__()
        tags.estimator_type = "regressor"
        return tags


class StockPredictor:
    def __init__(self, db_session: Session):
        self.db = db_session
        self.models_huber: Dict[int, Any] = {}
        self.models_tweedie: Dict[int, Any] = {}
        self.calibrators: Dict[int, Any] = {}       # IsotonicRegression per horizon
        self.explainers: Dict[int, Any] = {}
        self.encoder = None
        self.training_sample_limit = int(os.getenv("STOCK_TRAINING_LIMIT", str(DEFAULT_TRAINING_SAMPLE_LIMIT)))
        self.safety_stock_quantile = float(os.getenv("STOCK_SAFETY_STOCK_QUANTILE", str(DEFAULT_SAFETY_STOCK_QUANTILE)))
        self.safety_stock_quantile = min(
            max(self.safety_stock_quantile, MIN_SAFETY_STOCK_QUANTILE),
            MAX_SAFETY_STOCK_QUANTILE,
        )
        self.segment_error_buffers: Dict[int, Dict] = {}
        self.family_error_buffers: Dict[int, Dict] = {}
        self.global_error_buffers: Dict[int, float] = {}
        
        # v10: Extended feature set (24 fitur)
        self.features_order = list(STOCK_FEATURE_COLUMNS)
        self.categorical_features = list(STOCK_CATEGORICAL_FEATURES)
        self.model_version = None
        os.makedirs(MODEL_ARTIFACTS_DIR, exist_ok=True)

    # ========================
    # DATA FETCHING
    # ========================

    def _feature_select(self):
        return select(
            MLFeatureStore.store_nbr,
            MLFeatureStore.family,
            MLFeatureStore.date,
            MLFeatureStore.city,
            MLFeatureStore.state,
            MLFeatureStore.cluster,
            MLFeatureStore.store_type,
            MLFeatureStore.rolling_7d_sales,
            MLFeatureStore.rolling_14d_sales,
            MLFeatureStore.rolling_30d_sales,
            MLFeatureStore.rolling_7d_std,
            MLFeatureStore.is_weekend,
            MLFeatureStore.days_since_payday,
            MLFeatureStore.onpromotion,
            MLFeatureStore.lag_1,
            MLFeatureStore.lag_2,
            MLFeatureStore.lag_3,
            MLFeatureStore.lag_7,
            MLFeatureStore.lag_14,
            MLFeatureStore.lag_30,
            MLFeatureStore.day_of_week,
            MLFeatureStore.is_month_end,
            MLFeatureStore.is_holiday_or_event,
            MLFeatureStore.days_to_next_holiday,
            MLFeatureStore.oil_price,
            # Targets
            MLFeatureStore.avg_demand_7d,
            MLFeatureStore.avg_demand_14d,
            MLFeatureStore.avg_demand_21d,
            MLFeatureStore.avg_demand_28d,
        )

    def _rows_to_dataframe(self, results, include_targets: bool = True) -> pd.DataFrame:
        if not results:
            return pd.DataFrame()

        cols = [
            'store_nbr', 'family', 'date', 'city', 'state', 'cluster', 'store_type',
            'rolling_7d_sales', 'rolling_14d_sales', 'rolling_30d_sales', 'rolling_7d_std',
            'is_weekend', 'days_since_payday', 'onpromotion',
            'lag_1', 'lag_2', 'lag_3', 'lag_7', 'lag_14', 'lag_30',
            'day_of_week', 'is_month_end', 'is_holiday_or_event', 'days_to_next_holiday',
            'oil_price',
            'avg_demand_7d', 'avg_demand_14d', 'avg_demand_21d', 'avg_demand_28d'
        ]
        df = pd.DataFrame(results, columns=cols)
        df['date'] = pd.to_datetime(df['date'])

        for col in ['is_weekend', 'is_month_end', 'is_holiday_or_event']:
            df[col] = df[col].astype(int)
        df['city'] = df['city'].fillna('UNKNOWN')
        df['state'] = df['state'].fillna('UNKNOWN')
        df['store_type'] = df['store_type'].fillna('UNKNOWN')

        numeric_cols = [
            'store_nbr', 'cluster', 'rolling_7d_sales', 'rolling_14d_sales', 'rolling_30d_sales',
            'rolling_7d_std', 'days_since_payday', 'onpromotion',
            'lag_1', 'lag_2', 'lag_3', 'lag_7', 'lag_14', 'lag_30',
            'day_of_week', 'oil_price', 'days_to_next_holiday'
        ]
        for col in numeric_cols:
            df[col] = pd.to_numeric(df[col], errors='coerce').fillna(0)

        df.sort_values(['date', 'store_nbr', 'family'], inplace=True)
        df.reset_index(drop=True, inplace=True)
        return df

    def fetch_data(self, sample_limit: Optional[int] = None) -> pd.DataFrame:
        if sample_limit is None:
            sample_limit = self.training_sample_limit

        query = self._feature_select()
        if sample_limit and sample_limit > 0:
            query = query.order_by(
                MLFeatureStore.date.desc(),
                MLFeatureStore.store_nbr,
                MLFeatureStore.family
            ).limit(sample_limit)
        else:
            query = query.order_by(
                MLFeatureStore.date,
                MLFeatureStore.store_nbr,
                MLFeatureStore.family
            )

        results = self.db.execute(query).fetchall()
        return self._rows_to_dataframe(results, include_targets=True)

    def fetch_latest_features(self) -> pd.DataFrame:
        latest_date = self.db.execute(
            select(MLFeatureStore.date).order_by(MLFeatureStore.date.desc()).limit(1)
        ).scalar_one_or_none()

        if latest_date is None:
            return pd.DataFrame()

        query = (
            self._feature_select()
            .where(MLFeatureStore.date == latest_date)
            .order_by(MLFeatureStore.store_nbr, MLFeatureStore.family)
        )
        results = self.db.execute(query).fetchall()
        return self._rows_to_dataframe(results, include_targets=False)

    # ========================
    # TRAINING UTILITIES
    # ========================

    @staticmethod
    def _clip_predictions(predictions) -> np.ndarray:
        return np.clip(np.asarray(predictions, dtype=float), 0, None)

    @staticmethod
    def _regression_metrics(y_true, y_pred) -> Dict[str, float]:
        y_true_arr = np.asarray(y_true, dtype=float)
        y_pred_arr = np.asarray(y_pred, dtype=float)
        abs_err = np.abs(y_true_arr - y_pred_arr)
        denom = np.sum(np.abs(y_true_arr))

        return {
            "mae": float(mean_absolute_error(y_true_arr, y_pred_arr)),
            "rmse": float(np.sqrt(mean_squared_error(y_true_arr, y_pred_arr))),
            "r2": float(r2_score(y_true_arr, y_pred_arr)) if np.var(y_true_arr) > 0 else 0.0,
            "wape": float(abs_err.sum() / denom) if denom > 0 else 0.0,
            "bias": float(np.mean(y_pred_arr - y_true_arr)),
            "p95_error": float(np.quantile(abs_err, 0.95)) if len(abs_err) > 0 else 0.0,
        }

    @staticmethod
    def _chronological_train_test_split(df: pd.DataFrame, train_ratio: float = TRAIN_TEST_SPLIT_RATIO):
        unique_dates = pd.Series(df['date'].dropna().sort_values().unique())
        if len(unique_dates) > 1:
            split_pos = int(len(unique_dates) * train_ratio)
            split_pos = min(max(split_pos, 1), len(unique_dates) - 1)
            split_date = unique_dates.iloc[split_pos]
            return df[df['date'] < split_date].copy(), df[df['date'] >= split_date].copy(), split_date
        return df.copy(), pd.DataFrame(), None

    def _error_buffer(self, abs_errors: pd.Series) -> float:
        clean_errors = pd.to_numeric(abs_errors, errors='coerce').dropna()
        if clean_errors.empty:
            return 0.0
        return float(clean_errors.quantile(self.safety_stock_quantile))

    def _build_error_buffers_for_horizon(self, test_df: pd.DataFrame, horizon: int):
        target_col = f'avg_demand_{horizon}d'
        pred_col = f'predicted_{horizon}d'

        evaluated_df = test_df.dropna(subset=[pred_col, target_col]).copy()
        if evaluated_df.empty:
            self.global_error_buffers[horizon] = 0.0
            return

        evaluated_df['under_forecast_error'] = (
            evaluated_df[target_col].astype(float) - evaluated_df[pred_col].astype(float)
        ).clip(lower=0)

        self.global_error_buffers[horizon] = self._error_buffer(evaluated_df['under_forecast_error'])

        self.family_error_buffers[horizon] = {}
        for family, group in evaluated_df.groupby('family'):
            if len(group) >= MIN_ERROR_BUFFER_SEGMENT_SIZE:
                self.family_error_buffers[horizon][str(family)] = self._error_buffer(group['under_forecast_error'])

        self.segment_error_buffers[horizon] = {}
        for (store_nbr, family), group in evaluated_df.groupby(['store_nbr', 'family']):
            if len(group) >= MIN_ERROR_BUFFER_SEGMENT_SIZE:
                self.segment_error_buffers[horizon][(int(store_nbr), str(family))] = self._error_buffer(group['under_forecast_error'])

    # ========================
    # TRAINING — ENSEMBLE + CALIBRATION
    # ========================

    def train_if_needed(self, df: pd.DataFrame):
        """Train dual-ensemble (Huber+Tweedie) + Isotonic calibration per horizon."""
        # Cek persistence
        all_exist = all(
            os.path.exists(os.path.join(MODEL_ARTIFACTS_DIR, f"huber_{h}d.joblib")) and
            os.path.exists(os.path.join(MODEL_ARTIFACTS_DIR, f"tweedie_{h}d.joblib"))
            for h in STOCK_PREDICTOR_HORIZONS
        ) and os.path.exists(os.path.join(MODEL_ARTIFACTS_DIR, "encoder_v10.joblib"))

        if all_exist:
            print("\n[MLOps] Persistence: Semua model v10 ditemukan. Me-load dari joblib...")
            self.encoder = joblib.load(os.path.join(MODEL_ARTIFACTS_DIR, "encoder_v10.joblib"))
            for h in STOCK_PREDICTOR_HORIZONS:
                self.models_huber[h] = joblib.load(os.path.join(MODEL_ARTIFACTS_DIR, f"huber_{h}d.joblib"))
                self.models_tweedie[h] = joblib.load(os.path.join(MODEL_ARTIFACTS_DIR, f"tweedie_{h}d.joblib"))
                cal_path = os.path.join(MODEL_ARTIFACTS_DIR, f"calibrator_{h}d.joblib")
                if os.path.exists(cal_path):
                    self.calibrators[h] = joblib.load(cal_path)
                exp_path = os.path.join(MODEL_ARTIFACTS_DIR, f"explainer_v10_{h}d.joblib")
                if os.path.exists(exp_path):
                    self.explainers[h] = joblib.load(exp_path)
            self.model_version = "stock_v10_ensemble_loaded"
            return

        if df is None or df.empty:
            return

        print("\n🧠 3. MELATIH MODEL AI v10 (Ensemble Huber+Tweedie × 4 Horizons)")
        train_start_time = datetime.now(timezone.utc)

        import category_encoders as ce

        for horizon in STOCK_PREDICTOR_HORIZONS:
            target_col = f'avg_demand_{horizon}d'
            print(f"\n  ──── Horizon H+{horizon} ({target_col}) ────")

            labeled_df = df.dropna(subset=[target_col]).copy()
            labeled_df.sort_values(['date', 'store_nbr', 'family'], inplace=True)

            if labeled_df.empty:
                print(f"  ⚠️ Tidak ada data target untuk {target_col}. Skip.")
                continue

            train_df, test_df, split_date = self._chronological_train_test_split(labeled_df)

            # v10: Clipping di p99.95 (preserve more tail data)
            p99_train = train_df[target_col].quantile(TARGET_CLIP_QUANTILE)
            train_df[target_col] = train_df[target_col].clip(upper=p99_train)
            test_df[target_col] = test_df[target_col].clip(upper=p99_train)

            X_train, y_train = train_df[self.features_order], train_df[target_col]
            X_test, y_test = test_df[self.features_order], test_df[target_col]

            # Encoder: fit sekali
            if self.encoder is None:
                self.encoder = ce.TargetEncoder(cols=self.categorical_features, smoothing=10)
                X_train_enc = self.encoder.fit_transform(X_train, y_train)
            else:
                X_train_enc = self.encoder.transform(X_train)
            X_test_enc = self.encoder.transform(X_test)

            # ── Train Model 1: Huber (robust ke outlier) ──
            model_huber = SklearnCompatibleXGBRegressor(**STOCK_HUBER_PARAMS)
            model_huber.fit(X_train_enc, y_train)
            self.models_huber[horizon] = model_huber

            # ── Train Model 2: Tweedie (positif natural) ──
            model_tweedie = SklearnCompatibleXGBRegressor(**STOCK_TWEEDIE_PARAMS)
            model_tweedie.fit(X_train_enc, y_train)
            self.models_tweedie[horizon] = model_tweedie

            # ── Ensemble: average kedua model ──
            preds_huber = self._clip_predictions(model_huber.predict(X_test_enc))
            preds_tweedie = self._clip_predictions(model_tweedie.predict(X_test_enc))
            raw_ensemble = (preds_huber + preds_tweedie) / ENSEMBLE_MODEL_WEIGHT

            # ── Isotonic Calibration (bias correction non-linear) ──
            y_test_arr = y_test.values.astype(float)
            calibrator = IsotonicRegression(y_min=0, out_of_bounds='clip')
            calibrator.fit(raw_ensemble, y_test_arr)
            self.calibrators[horizon] = calibrator

            calibrated_preds = self._clip_predictions(calibrator.predict(raw_ensemble))

            test_df[f'predicted_{horizon}d'] = calibrated_preds
            self._build_error_buffers_for_horizon(test_df, horizon)

            # ── Metrics: Before vs After calibration ──
            metrics_raw = self._regression_metrics(y_test_arr, raw_ensemble)
            metrics_cal = self._regression_metrics(y_test_arr, calibrated_preds)

            print(f"  📊 RAW Ensemble : MAE={metrics_raw['mae']:.2f} | RMSE={metrics_raw['rmse']:.2f} | R²={metrics_raw['r2']:.4f} | WAPE={metrics_raw['wape']:.4f} | Bias={metrics_raw['bias']:+.2f}")
            print(f"  ✅ CALIBRATED   : MAE={metrics_cal['mae']:.2f} | RMSE={metrics_cal['rmse']:.2f} | R²={metrics_cal['r2']:.4f} | WAPE={metrics_cal['wape']:.4f} | Bias={metrics_cal['bias']:+.2f}")

            # Save metrics to DB
            try:
                metrics_db = []
                for k, v in metrics_cal.items():
                    metrics_db.append(AIModelMetric(
                        store_nbr=None,
                        model_name=f"StockPredictor_v10_Ensemble_H{horizon}",
                        metric_name=k.upper(),
                        metric_value=v
                    ))
                self.db.add_all(metrics_db)
                self.db.commit()
            except Exception as e:
                self.db.rollback()
                print(f"  [Warning] Gagal simpan metrik H+{horizon}: {e}")

            # SHAP explainer (H+7 only)
            if horizon == SHAP_EXPLAINER_HORIZON:
                try:
                    self.explainers[horizon] = shap.TreeExplainer(model_huber)
                except Exception:
                    pass

        self.model_version = f"stock_v10.0_ensemble_{train_start_time.strftime('%Y%m%d_%H%M%S')}"

        # Persist
        joblib.dump(self.encoder, os.path.join(MODEL_ARTIFACTS_DIR, "encoder_v10.joblib"))
        for h in STOCK_PREDICTOR_HORIZONS:
            if h in self.models_huber:
                joblib.dump(self.models_huber[h], os.path.join(MODEL_ARTIFACTS_DIR, f"huber_{h}d.joblib"))
            if h in self.models_tweedie:
                joblib.dump(self.models_tweedie[h], os.path.join(MODEL_ARTIFACTS_DIR, f"tweedie_{h}d.joblib"))
            if h in self.calibrators:
                joblib.dump(self.calibrators[h], os.path.join(MODEL_ARTIFACTS_DIR, f"calibrator_{h}d.joblib"))
            if h in self.explainers:
                joblib.dump(self.explainers[h], os.path.join(MODEL_ARTIFACTS_DIR, f"explainer_v10_{h}d.joblib"))

        print(f"\n[MLOps] Persistensi v10 Berhasil: {len(self.models_huber)} ensemble × 2 + calibrators tersimpan di {MODEL_ARTIFACTS_DIR}")

    # ========================
    # INFERENCE
    # ========================

    def _predict_single_horizon(self, X_encoded: np.ndarray, horizon: int) -> np.ndarray:
        """Ensemble predict + isotonic calibration."""
        if horizon not in self.models_huber or horizon not in self.models_tweedie:
            return np.zeros(len(X_encoded))

        preds_h = self._clip_predictions(self.models_huber[horizon].predict(X_encoded))
        preds_t = self._clip_predictions(self.models_tweedie[horizon].predict(X_encoded))
        raw = (preds_h + preds_t) / ENSEMBLE_MODEL_WEIGHT

        if horizon in self.calibrators:
            return self._clip_predictions(self.calibrators[horizon].predict(raw))
        return raw

    # ========================
    # STOCK RECOMMENDATION
    # ========================

    def recommend_stock(self, row: pd.Series, predicted_val: float, horizon: int):
        predicted_val = max(float(predicted_val), 0.0)
        store_nbr, family = int(row['store_nbr']), str(row['family'])

        segment_key = (store_nbr, family)
        seg_buffers = self.segment_error_buffers.get(horizon, {})
        fam_buffers = self.family_error_buffers.get(horizon, {})
        global_buf = self.global_error_buffers.get(horizon, 0.0)

        if segment_key in seg_buffers:
            buffer_value = seg_buffers[segment_key]
            buffer_source = "store_family_validation_error"
        elif family in fam_buffers:
            buffer_value = fam_buffers[family]
            buffer_source = "family_validation_error"
        else:
            buffer_value = global_buf
            buffer_source = "global_validation_error"

        total_demand = predicted_val * horizon
        recommended_stock = int(np.ceil(total_demand + max(buffer_value * horizon, 0.0)))
        return recommended_stock, float(buffer_value), buffer_source

    def generate_human_story(self, row, shap_values, predicted_val, horizon, recommended_stock=None, safety_stock_buffer=None):
        predicted_val = max(float(predicted_val), 0.0)
        total_demand = predicted_val * horizon
        stock_text = f" Rekomendasi stok {horizon} hari: {int(recommended_stock)} qty." if recommended_stock is not None else ""

        if shap_values is None:
            return f"Prediksi rata-rata demand harian ({horizon}d): {predicted_val:.1f} qty. Total demand: {total_demand:.0f}.{stock_text}"

        shap_contributions = np.asarray(getattr(shap_values, "values", shap_values), dtype=float).reshape(-1)
        feature_contributions = dict(zip(self.features_order, shap_contributions))

        top_3 = sorted(feature_contributions.items(), key=lambda x: abs(x[1]), reverse=True)[:3]
        top_feature, top_contrib = top_3[0]

        return (
            f"Prediksi rata-rata demand harian ({horizon}d): {predicted_val:.1f} qty. "
            f"Total demand: {total_demand:.0f}.{stock_text} "
            f"Faktor dominan: '{top_feature}' kontribusi {top_contrib:+.2f}."
        )

    # ========================
    # MAIN PREDICTION
    # ========================

    def predict_latest(self) -> List[Dict[str, Any]]:
        training_df = self.fetch_data()
        self.train_if_needed(training_df)

        if (not self.models_huber or not self.models_tweedie) or self.encoder is None:
            return []

        df_latest = self.fetch_latest_features()
        if df_latest.empty and not training_df.empty:
            df_latest = training_df[training_df['date'] == training_df['date'].max()].copy()

        if df_latest.empty:
            return []

        X_infer = df_latest[self.features_order]
        X_infer_encoded = self.encoder.transform(X_infer)

        predictions = []
        for horizon in STOCK_PREDICTOR_HORIZONS:
            preds = self._predict_single_horizon(X_infer_encoded, horizon)

            shap_vals = None
            if horizon == SHAP_EXPLAINER_HORIZON and SHAP_EXPLAINER_HORIZON in self.explainers:
                try:
                    shap_vals = self.explainers[SHAP_EXPLAINER_HORIZON](X_infer_encoded)
                except Exception:
                    pass

            for i, idx in enumerate(df_latest.index):
                row = df_latest.loc[idx]
                pred_val = float(preds[i])
                recommended_stock, safety_buffer, buffer_source = self.recommend_stock(row, pred_val, horizon)
                story = self.generate_human_story(
                    row, shap_vals[i] if shap_vals is not None else None,
                    pred_val, horizon, recommended_stock, safety_buffer
                )

                predictions.append({
                    "store_nbr": int(row['store_nbr']),
                    "family": str(row['family']),
                    "predicted_for_date": (row['date'] + pd.Timedelta(days=horizon)).date(),
                    "prediction_type": "stock_demand",
                    "predicted_value": pred_val,
                    "recommended_stock": recommended_stock,
                    "safety_stock_buffer": safety_buffer,
                    "safety_stock_source": buffer_source,
                    "reasoning_text": story,
                    "model_version": self.model_version,
                    "horizon_days": horizon,
                    "prediction_level": "family",
                })

        print(f"[StockPredictor] {len(predictions)} prediksi multi-horizon siap ({len(STOCK_PREDICTOR_HORIZONS)} horizons x {len(df_latest)} segments).")
        return predictions
