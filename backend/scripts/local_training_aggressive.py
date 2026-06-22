"""
InsightSphere - Local ML Training Aggressive C.

Offline CSV pipeline for strategy C:
- extended retail features: promotion, medium lags, rolling volatility, store type,
  days to next holiday
- Huber + Tweedie ensemble for mean demand
- XGBoost quantile regression for P85 demand
- isotonic calibration for non-linear bias correction

This script intentionally writes to a separate artifact directory so
backend/local_training.py remains available for v1 comparison.
"""
from __future__ import annotations

import gc
import json
import os
import time
from datetime import UTC, datetime
from typing import Any

import joblib
import numpy as np
import pandas as pd
import xgboost as xgb
from sklearn.isotonic import IsotonicRegression
from sklearn.metrics import (
    mean_absolute_error,
    mean_pinball_loss,
    mean_squared_error,
    r2_score,
)


BASE_DIR = os.path.dirname(os.path.abspath(__file__))
CSV_DIR = os.path.join(os.path.dirname(BASE_DIR), "store-sales-time-series-forecasting")
ARTIFACTS_DIR = os.getenv(
    "STOCK_AGGRESSIVE_ARTIFACTS_DIR",
    os.path.join(BASE_DIR, "domains", "intelligence", "artifacts_aggressive"),
)
os.makedirs(ARTIFACTS_DIR, exist_ok=True)

HORIZONS = [7, 14, 21, 28]
RANDOM_STATE = 42
P85_ALPHA = 0.85
SAMPLE_LIMIT_STR = os.getenv("STOCK_TRAINING_LIMIT")
SAMPLE_LIMIT = int(SAMPLE_LIMIT_STR) if SAMPLE_LIMIT_STR is not None and SAMPLE_LIMIT_STR.isdigit() else None
TARGET_CLIP_QUANTILE = float(os.getenv("STOCK_TARGET_CLIP_QUANTILE", "0.9995"))
TRAIN_RATIO = float(os.getenv("STOCK_AGGRESSIVE_TRAIN_RATIO", "0.70"))
CALIBRATION_RATIO = float(os.getenv("STOCK_AGGRESSIVE_CALIBRATION_RATIO", "0.15"))
N_ESTIMATORS = int(os.getenv("STOCK_AGGRESSIVE_N_ESTIMATORS", "300"))
MAX_DEPTH = int(os.getenv("STOCK_AGGRESSIVE_MAX_DEPTH", "7"))
LEARNING_RATE = float(os.getenv("STOCK_AGGRESSIVE_LEARNING_RATE", "0.03"))
SAVE_ARTIFACTS = os.getenv("STOCK_AGGRESSIVE_SKIP_SAVE", "0") != "1"
RUN_OOS_AUDIT = os.getenv("STOCK_AGGRESSIVE_OOS_AUDIT", "1") != "0"
P85_TARGET_COVERAGE = float(os.getenv("STOCK_P85_TARGET_COVERAGE", "0.87"))
SEGMENT_MIN_ROWS = int(os.getenv("STOCK_SEGMENT_MIN_ROWS", "50"))
SEGMENT_TOP_N = int(os.getenv("STOCK_SEGMENT_TOP_N", "15"))

DEFAULT_OOS_WINDOWS = [
    {
        "name": "jan_2017",
        "train_end": "2016-12-01",
        "test_start": "2017-01-01",
        "test_end": "2017-02-01",
        "reason": "post-holiday unseen production month",
    },
    {
        "name": "dec_2016_holiday_promo",
        "train_end": "2016-11-01",
        "test_start": "2016-12-01",
        "test_end": "2017-01-01",
        "reason": "highest promotion month and holiday season",
    },
    {
        "name": "may_2017_high_promo",
        "train_end": "2017-04-01",
        "test_start": "2017-05-01",
        "test_end": "2017-06-01",
        "reason": "highest promotion month in 2017 sample window",
    },
    {
        "name": "earthquake_2016",
        "train_end": "2016-03-01",
        "test_start": "2016-04-01",
        "test_end": "2016-06-01",
        "reason": "demand shock from 2016 earthquake",
    },
    {
        "name": "sep_oct_2016",
        "train_end": "2016-08-01",
        "test_start": "2016-09-01",
        "test_end": "2016-11-01",
        "reason": "recovery pattern post-earthquake",
    },
]

FEATURES_ORDER = [
    "store_nbr",
    "family",
    "city",
    "state",
    "cluster",
    "store_type",
    "rolling_7d_sales",
    "rolling_14d_sales",
    "rolling_30d_sales",
    "rolling_7d_std",
    "is_weekend",
    "days_since_payday",
    "onpromotion",
    "lag_1",
    "lag_2",
    "lag_3",
    "lag_7",
    "lag_14",
    "lag_30",
    "day_of_week",
    "is_month_end",
    "is_holiday_or_event",
    "days_to_next_holiday",
    "oil_price",
]

CATEGORICAL_FEATURES = [
    "store_nbr",
    "family",
    "city",
    "state",
    "cluster",
    "store_type",
]


class SklearnCompatibleXGBRegressor(xgb.XGBRegressor):
    def __sklearn_tags__(self):
        tags = super().__sklearn_tags__()
        tags.estimator_type = "regressor"
        return tags


class SimpleTargetEncoder:
    """Small fallback when category_encoders is not installed."""

    def __init__(self, cols: list[str], smoothing: float = 10.0):
        self.cols = cols
        self.smoothing = float(smoothing)
        self.global_mean = 0.0
        self.maps: dict[str, dict[Any, float]] = {}

    def fit(self, X: pd.DataFrame, y: pd.Series):
        self.global_mean = float(pd.Series(y).mean())
        for col in self.cols:
            stats_df = pd.DataFrame(
                {
                    col: X[col].astype("object").to_numpy(),
                    "_target": pd.Series(y).to_numpy(),
                }
            )
            grouped = stats_df.groupby(col, dropna=False)["_target"].agg(["mean", "count"])
            smoothed = (
                (grouped["mean"] * grouped["count"] + self.global_mean * self.smoothing)
                / (grouped["count"] + self.smoothing)
            )
            self.maps[col] = smoothed.to_dict()
        return self

    def transform(self, X: pd.DataFrame) -> pd.DataFrame:
        encoded = X.copy()
        for col in self.cols:
            encoded[col] = (
                encoded[col]
                .astype("object")
                .map(self.maps.get(col, {}))
                .fillna(self.global_mean)
                .astype("float32")
            )
        return encoded

    def fit_transform(self, X: pd.DataFrame, y: pd.Series) -> pd.DataFrame:
        return self.fit(X, y).transform(X)


def _make_target_encoder(cols: list[str], smoothing: float = 10.0, require_portable_artifact: bool = True):
    try:
        import category_encoders as ce

        return ce.TargetEncoder(cols=cols, smoothing=smoothing)
    except ModuleNotFoundError as exc:
        try:
            from sklearn.compose import ColumnTransformer
            from sklearn.preprocessing import TargetEncoder

            print("  [Info] category_encoders not installed; using sklearn TargetEncoder fallback.")
            return ColumnTransformer(
                transformers=[
                    (
                        "target_encoder",
                        TargetEncoder(
                            target_type="continuous",
                            smooth=smoothing,
                            cv=5,
                            shuffle=True,
                            random_state=RANDOM_STATE,
                        ),
                        cols,
                    )
                ],
                remainder="passthrough",
                verbose_feature_names_out=False,
            )
        except (ModuleNotFoundError, ImportError) as sklearn_exc:
            if require_portable_artifact:
                raise ModuleNotFoundError(
                    "category_encoders or sklearn.preprocessing.TargetEncoder is required "
                    "for saved aggressive artifacts. Install backend/requirements.txt or "
                    "run smoke tests with STOCK_AGGRESSIVE_SKIP_SAVE=1."
                ) from sklearn_exc
        print("  [Info] category_encoders/sklearn TargetEncoder unavailable; using SimpleTargetEncoder fallback.")
        return SimpleTargetEncoder(cols=cols, smoothing=smoothing)


def _json_default(value: Any) -> Any:
    if isinstance(value, (np.integer,)):
        return int(value)
    if isinstance(value, (np.floating,)):
        return float(value)
    if isinstance(value, (np.ndarray,)):
        return value.tolist()
    if isinstance(value, (pd.Timestamp, datetime)):
        return value.isoformat()
    return str(value)


def _parse_oos_windows() -> list[dict[str, str]]:
    raw_windows = os.getenv("STOCK_AGGRESSIVE_OOS_WINDOWS")
    if not raw_windows:
        return DEFAULT_OOS_WINDOWS

    try:
        parsed = json.loads(raw_windows)
        if not isinstance(parsed, list):
            raise ValueError("OOS windows JSON must be a list")

        windows: list[dict[str, str]] = []
        for idx, item in enumerate(parsed):
            if not isinstance(item, dict):
                raise ValueError(f"OOS window #{idx + 1} must be an object")
            for required_key in ["name", "train_end", "test_start", "test_end"]:
                if required_key not in item:
                    raise ValueError(f"OOS window #{idx + 1} missing {required_key}")
            windows.append(
                {
                    "name": str(item["name"]),
                    "train_end": str(item["train_end"]),
                    "test_start": str(item["test_start"]),
                    "test_end": str(item["test_end"]),
                    "reason": str(item.get("reason", "custom_oos_window")),
                }
            )
        return windows
    except Exception as exc:
        print(f"  [Warning] STOCK_AGGRESSIVE_OOS_WINDOWS invalid: {exc}. Falling back to defaults.")
        return DEFAULT_OOS_WINDOWS


OOS_WINDOWS = _parse_oos_windows()


def _as_metric_dict(y_true, y_pred) -> dict[str, float]:
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
        "p95_error": float(np.quantile(abs_err, 0.95)) if len(abs_err) else 0.0,
    }


def _target_diagnostics(y_true) -> dict[str, float]:
    y_true_arr = np.asarray(y_true, dtype=float)
    if len(y_true_arr) == 0:
        return {
            "mean": 0.0,
            "std": 0.0,
            "cv": 0.0,
            "p50": 0.0,
            "p95": 0.0,
            "zero_pct": 0.0,
        }

    mean_val = float(np.mean(y_true_arr))
    return {
        "mean": mean_val,
        "std": float(np.std(y_true_arr)),
        "cv": float(np.std(y_true_arr) / mean_val) if mean_val else 0.0,
        "p50": float(np.quantile(y_true_arr, 0.50)),
        "p95": float(np.quantile(y_true_arr, 0.95)),
        "zero_pct": float(np.mean(y_true_arr == 0)),
    }


def _print_metric_line(prefix: str, metrics: dict[str, float]) -> None:
    print(
        f"  {prefix:<13} "
        f"MAE={metrics['mae']:.2f} | "
        f"RMSE={metrics['rmse']:.2f} | "
        f"R2={metrics['r2']:.4f} | "
        f"WAPE={metrics['wape']:.4f} | "
        f"Bias={metrics['bias']:+.2f}"
    )


def _future_average(series: pd.Series, horizon: int) -> pd.Series:
    # Baseline-compatible target definition from local_training.py.
    return series.shift(-1).rolling(window=horizon, min_periods=max(1, horizon // 2)).mean()


def _days_since_payday(day: pd.Timestamp) -> int:
    if day.day == 15 or day.is_month_end:
        return 0
    if day.day < 15:
        previous_month_end = day - pd.Timedelta(days=day.day)
        return int((day - previous_month_end).days)
    return int((day - day.replace(day=15)).days)


def _days_to_next_holiday_map(dates: pd.Series, holidays: pd.Series) -> pd.DataFrame:
    unique_dates = pd.Series(pd.to_datetime(dates.unique())).sort_values().reset_index(drop=True)
    holiday_dates = pd.Series(pd.to_datetime(holidays.unique())).sort_values().reset_index(drop=True)

    mapping: list[dict[str, Any]] = []
    holiday_idx = 0
    for current_date in unique_dates:
        while holiday_idx < len(holiday_dates) and holiday_dates.iloc[holiday_idx] < current_date:
            holiday_idx += 1
        if holiday_idx < len(holiday_dates):
            days_to_next = int((holiday_dates.iloc[holiday_idx] - current_date).days)
        else:
            days_to_next = 30
        mapping.append({"date": current_date, "days_to_next_holiday": min(max(days_to_next, 0), 30)})

    return pd.DataFrame(mapping)


def _prediction_bins(y_true, raw_pred, calibrated_pred, n_bins: int = 10) -> list[dict[str, float]]:
    data = pd.DataFrame(
        {
            "actual": np.asarray(y_true, dtype=float),
            "raw": np.asarray(raw_pred, dtype=float),
            "calibrated": np.asarray(calibrated_pred, dtype=float),
        }
    ).replace([np.inf, -np.inf], np.nan).dropna()

    if data.empty:
        return []

    unique_raw = data["raw"].nunique()
    if unique_raw <= 1:
        data["bin_id"] = 0
    else:
        bin_count = min(n_bins, unique_raw)
        data["bin_id"] = pd.qcut(data["raw"], q=bin_count, labels=False, duplicates="drop")

    rows: list[dict[str, float]] = []
    for raw_bin_id, group in data.groupby("bin_id", dropna=False):
        bin_val = -1
        # Use str conversion as universal fallback before float casting
        # to satisfy strict type checkers like Pylance regarding Any | Hashable types.
        if raw_bin_id is not None and not pd.isna(raw_bin_id):
            try:
                bin_val = int(float(str(raw_bin_id)))
            except (ValueError, TypeError):
                bin_val = -1  # Fallback

        rows.append(
            {
                "bin": float(bin_val),
                "rows": int(len(group)),
                "raw_min": float(group["raw"].min()),
                "raw_max": float(group["raw"].max()),
                "raw_mean": float(group["raw"].mean()),
                "calibrated_mean": float(group["calibrated"].mean()),
                "actual_mean": float(group["actual"].mean()),
                "mean_lift": float((group["calibrated"] - group["raw"]).mean()),
                "raw_bias": float((group["raw"] - group["actual"]).mean()),
                "calibrated_bias": float((group["calibrated"] - group["actual"]).mean()),
            }
        )
    return rows


def _calibration_audit(
    calibrator: IsotonicRegression,
    y_cal,
    raw_cal,
    calibrated_cal,
    y_test,
    raw_test,
    calibrated_test,
) -> dict[str, Any]:
    x_thresholds = np.asarray(getattr(calibrator, "X_thresholds_", []), dtype=float)
    y_thresholds = np.asarray(getattr(calibrator, "y_thresholds_", []), dtype=float)
    cal_lift = np.asarray(calibrated_cal, dtype=float) - np.asarray(raw_cal, dtype=float)
    test_lift = np.asarray(calibrated_test, dtype=float) - np.asarray(raw_test, dtype=float)

    if len(x_thresholds) > 0:
        lower_edge = float(np.min(x_thresholds))
        upper_edge = float(np.max(x_thresholds))
        raw_test_arr = np.asarray(raw_test, dtype=float)
        edge_clip_rate = float(np.mean((raw_test_arr < lower_edge) | (raw_test_arr > upper_edge)))
    else:
        lower_edge = 0.0
        upper_edge = 0.0
        edge_clip_rate = 0.0

    return {
        "method": "sklearn.isotonic.IsotonicRegression",
        "fit_scope": "calibration_split_only",
        "test_target_used_in_fit": False,
        "n_thresholds": int(len(x_thresholds)),
        "raw_input_range": {
            "min": lower_edge,
            "max": upper_edge,
        },
        "calibrated_output_range": {
            "min": float(np.min(y_thresholds)) if len(y_thresholds) else 0.0,
            "max": float(np.max(y_thresholds)) if len(y_thresholds) else 0.0,
        },
        "edge_clip_rate_test": edge_clip_rate,
        "lift_summary_calibration": {
            "mean": float(np.mean(cal_lift)) if len(cal_lift) else 0.0,
            "median": float(np.median(cal_lift)) if len(cal_lift) else 0.0,
            "p05": float(np.quantile(cal_lift, 0.05)) if len(cal_lift) else 0.0,
            "p95": float(np.quantile(cal_lift, 0.95)) if len(cal_lift) else 0.0,
        },
        "lift_summary_test": {
            "mean": float(np.mean(test_lift)) if len(test_lift) else 0.0,
            "median": float(np.median(test_lift)) if len(test_lift) else 0.0,
            "p05": float(np.quantile(test_lift, 0.05)) if len(test_lift) else 0.0,
            "p95": float(np.quantile(test_lift, 0.95)) if len(test_lift) else 0.0,
        },
        "calibration_split_metrics": {
            "raw_ensemble": _as_metric_dict(y_cal, raw_cal),
            "calibrated_ensemble": _as_metric_dict(y_cal, calibrated_cal),
        },
        "test_split_metrics": {
            "raw_ensemble": _as_metric_dict(y_test, raw_test),
            "calibrated_ensemble": _as_metric_dict(y_test, calibrated_test),
        },
        "calibration_bins": _prediction_bins(y_cal, raw_cal, calibrated_cal),
        "test_bins": _prediction_bins(y_test, raw_test, calibrated_test),
    }


def _calibrate_quantile_to_coverage(y_cal, quantile_cal, quantile_test, target_coverage: float):
    y_cal_arr = np.asarray(y_cal, dtype=float)
    q_cal_arr = np.asarray(quantile_cal, dtype=float)
    q_test_arr = np.asarray(quantile_test, dtype=float)

    if len(y_cal_arr) == 0:
        return np.clip(q_test_arr, 0, None), {
            "target_coverage": target_coverage,
            "additive_offset": 0.0,
            "coverage_calibration": 0.0,
        }

    residual_to_cover = y_cal_arr - q_cal_arr
    offset = float(np.quantile(residual_to_cover, target_coverage))
    calibrated_cal = np.clip(q_cal_arr + offset, 0, None)
    calibrated_test = np.clip(q_test_arr + offset, 0, None)

    return calibrated_test, {
        "method": "additive_coverage_offset",
        "target_coverage": target_coverage,
        "additive_offset": offset,
        "coverage_calibration": float(np.mean(y_cal_arr <= calibrated_cal)),
        "raw_coverage_calibration": float(np.mean(y_cal_arr <= q_cal_arr)),
        "raw_quantile_bias_calibration": float(np.mean(q_cal_arr - y_cal_arr)),
        "calibrated_quantile_bias_calibration": float(np.mean(calibrated_cal - y_cal_arr)),
    }


def _assign_volume_tier(df: pd.DataFrame, target_col: str) -> pd.Series:
    volume = pd.to_numeric(df.get("rolling_30d_sales", df[target_col]), errors="coerce")
    volume = volume.fillna(pd.to_numeric(df[target_col], errors="coerce").fillna(0))
    q33 = float(volume.quantile(0.33))
    q66 = float(volume.quantile(0.66))
    return pd.Series(
        np.select(
            [volume <= q33, volume <= q66],
            ["low", "medium"],
            default="high",
        ),
        index=df.index,
    )


def _group_metric_rows(
    df: pd.DataFrame,
    group_cols: list[str],
    target_col: str,
    pred_col: str,
    top_n: int | None = None,
    min_rows: int = SEGMENT_MIN_ROWS,
) -> list[dict[str, Any]]:
    rows: list[dict[str, Any]] = []
    for key, group in df.groupby(group_cols, dropna=False, observed=True):
        if len(group) < min_rows:
            continue

        y_true = group[target_col].astype(float).to_numpy()
        y_pred = group[pred_col].astype(float).to_numpy()
        metrics = _as_metric_dict(y_true, y_pred)

        if not isinstance(key, tuple):
            key = (key,)

        row: dict[str, Any] = {}
        for group_col, raw_val in zip(group_cols, key):
            val: Any = raw_val
            is_na = False
            if val is None:
                is_na = True
            elif isinstance(val, (float, np.floating)) and np.isnan(val):
                is_na = True
            elif pd.api.types.is_scalar(val) and pd.isna(val):
                is_na = True
            row[group_col] = None if is_na else val

        row.update(
            {
                "rows": int(len(group)),
                "actual_sum": float(np.sum(y_true)),
                "predicted_sum": float(np.sum(y_pred)),
                "coverage": float(np.mean(y_true <= y_pred)),
                **metrics,
            }
        )
        rows.append(row)

    rows.sort(key=lambda item: item.get("wape", 0.0), reverse=True)
    if top_n is not None:
        return rows[:top_n]
    return rows


def _segment_diagnostics(test_df: pd.DataFrame, target_col: str) -> dict[str, Any]:
    evaluated_df = test_df.dropna(subset=[target_col, "pred_calibrated", "pred_p85_calibrated"]).copy()
    if evaluated_df.empty:
        return {}

    evaluated_df["volume_tier"] = _assign_volume_tier(evaluated_df, target_col)

    diagnostics: dict[str, Any] = {}
    for pred_col in ["pred_calibrated", "pred_p85_calibrated"]:
        label = "calibrated_ensemble" if pred_col == "pred_calibrated" else "p85_quantile_calibrated"
        diagnostics[label] = {
            "by_store_type": _group_metric_rows(
                evaluated_df,
                ["store_type"],
                target_col,
                pred_col,
                top_n=None,
                min_rows=max(10, SEGMENT_MIN_ROWS),
            ),
            "by_volume_tier": _group_metric_rows(
                evaluated_df,
                ["volume_tier"],
                target_col,
                pred_col,
                top_n=None,
                min_rows=max(10, SEGMENT_MIN_ROWS),
            ),
            "worst_families": _group_metric_rows(
                evaluated_df,
                ["family"],
                target_col,
                pred_col,
                top_n=SEGMENT_TOP_N,
            ),
            "worst_store_family": _group_metric_rows(
                evaluated_df,
                ["store_nbr", "family"],
                target_col,
                pred_col,
                top_n=SEGMENT_TOP_N,
            ),
        }

    return diagnostics


def load_csv_data():
    print("=" * 72)
    print("  TAHAP 1: LOAD DATA CSV")
    print("=" * 72)

    train_path = os.path.join(CSV_DIR, "train.csv")
    stores_path = os.path.join(CSV_DIR, "stores.csv")
    oil_path = os.path.join(CSV_DIR, "oil.csv")
    holidays_path = os.path.join(CSV_DIR, "holidays_events.csv")

    print("  -> train.csv")
    df_sales = pd.read_csv(
        train_path,
        usecols=["date", "store_nbr", "family", "sales", "onpromotion"],
        dtype={"store_nbr": "int16", "family": "category", "sales": "float32", "onpromotion": "float32"},
    )
    df_sales["date"] = pd.to_datetime(df_sales["date"])
    df_sales["onpromotion"] = pd.to_numeric(df_sales["onpromotion"], errors="coerce").fillna(0).astype("float32")
    print(f"     rows: {len(df_sales):,}")

    print("  -> stores.csv")
    df_stores = pd.read_csv(stores_path)
    df_stores.rename(columns={"type": "store_type"}, inplace=True)

    print("  -> oil.csv")
    df_oil = pd.read_csv(oil_path)
    df_oil.rename(columns={"dcoilwtico": "oil_price"}, inplace=True)
    df_oil["date"] = pd.to_datetime(df_oil["date"])

    print("  -> holidays_events.csv")
    df_holidays = pd.read_csv(holidays_path)
    df_holidays["date"] = pd.to_datetime(df_holidays["date"])
    active_holidays = df_holidays["transferred"].astype(str).str.lower().eq("false")
    df_holidays = df_holidays[active_holidays].drop_duplicates(subset=["date"]).copy()
    df_holidays["is_holiday_or_event"] = True

    return df_sales, df_stores, df_oil, df_holidays[["date", "is_holiday_or_event"]]


def feature_engineering(df_sales, df_stores, df_oil, df_holidays) -> pd.DataFrame:
    print("\n" + "=" * 72)
    print("  TAHAP 2: FEATURE ENGINEERING AGGRESSIVE")
    print("=" * 72)

    print("  -> cleansing histori mati")
    first_sale = (
        df_sales[df_sales["sales"] > 0]
        .groupby(["store_nbr", "family"], observed=True)["date"]
        .min()
        .reset_index()
    )
    first_sale.rename(columns={"date": "first_sale_date"}, inplace=True)
    initial_len = len(df_sales)
    df_sales = df_sales.merge(first_sale, on=["store_nbr", "family"], how="left")
    df_sales = df_sales[df_sales["first_sale_date"].notna()]
    df_sales = df_sales[df_sales["date"] >= df_sales["first_sale_date"]]
    df_sales.drop(columns=["first_sale_date"], inplace=True)
    print(f"     removed: {initial_len - len(df_sales):,} | remaining: {len(df_sales):,}")

    print("  -> merge store metadata + store_type")
    store_cols = ["store_nbr", "city", "state", "cluster", "store_type"]
    df_sales = df_sales.merge(df_stores[store_cols], on="store_nbr", how="left")
    del df_stores
    gc.collect()

    print("  -> merge oil prices")
    df_sales = df_sales.merge(df_oil, on="date", how="left")
    df_sales.sort_values("date", inplace=True)
    df_sales["oil_price"] = df_sales["oil_price"].ffill().bfill().astype("float32")
    del df_oil
    gc.collect()

    print("  -> merge holidays + days_to_next_holiday")
    dtnh = _days_to_next_holiday_map(df_sales["date"], df_holidays["date"])
    df_sales = df_sales.merge(df_holidays, on="date", how="left")
    df_sales = df_sales.merge(dtnh, on="date", how="left")
    df_sales["is_holiday_or_event"] = df_sales["is_holiday_or_event"].notna()
    df_sales["days_to_next_holiday"] = df_sales["days_to_next_holiday"].fillna(30).astype("int16")
    del df_holidays, dtnh
    gc.collect()

    print("  -> calendar features")
    df_sales["is_weekend"] = df_sales["date"].dt.weekday >= 5
    df_sales["day_of_week"] = df_sales["date"].dt.weekday.astype("int8")
    df_sales["is_month_end"] = df_sales["date"].dt.is_month_end

    unique_dates = pd.Series(df_sales["date"].unique())
    payday_map = pd.DataFrame(
        {
            "date": unique_dates,
            "days_since_payday": unique_dates.apply(_days_since_payday).astype("int16"),
        }
    )
    df_sales = df_sales.merge(payday_map, on="date", how="left")
    del payday_map
    gc.collect()

    print("  -> lags and rolling windows per store-family")
    df_sales.sort_values(["store_nbr", "family", "date"], inplace=True)
    grouped = df_sales.groupby(["store_nbr", "family"], observed=True)["sales"]

    for lag in [1, 2, 3, 7, 14, 30]:
        df_sales[f"lag_{lag}"] = grouped.shift(lag).astype("float32")

    df_sales["rolling_7d_sales"] = grouped.transform(
        lambda x: x.shift(1).rolling(window=7, min_periods=1).mean()
    ).astype("float32")
    df_sales["rolling_14d_sales"] = grouped.transform(
        lambda x: x.shift(1).rolling(window=14, min_periods=3).mean()
    ).astype("float32")
    df_sales["rolling_30d_sales"] = grouped.transform(
        lambda x: x.shift(1).rolling(window=30, min_periods=7).mean()
    ).astype("float32")
    df_sales["rolling_7d_std"] = grouped.transform(
        lambda x: x.shift(1).rolling(window=7, min_periods=2).std()
    ).fillna(0).astype("float32")

    print("  -> multi-horizon targets")
    for horizon in HORIZONS:
        target_col = f"avg_demand_{horizon}d"
        df_sales[target_col] = grouped.transform(lambda x, h=horizon: _future_average(x, h)).astype("float32")
        print(f"     {target_col}: {df_sales[target_col].notna().sum():,} valid rows")

    for col in ["city", "state", "store_type"]:
        df_sales[col] = df_sales[col].fillna("UNKNOWN")

    if SAMPLE_LIMIT is not None and SAMPLE_LIMIT > 0 and len(df_sales) > SAMPLE_LIMIT:
        print(f"  -> sample latest rows: {SAMPLE_LIMIT:,}")
        df_sales = df_sales.sort_values("date", ascending=False).head(SAMPLE_LIMIT).copy()
        df_sales.sort_values(["date", "store_nbr", "family"], inplace=True)

    print(f"\n  Feature matrix ready: {len(df_sales):,} rows, {len(df_sales.columns)} columns")
    return df_sales


def chronological_train_cal_test_split(df: pd.DataFrame):
    unique_dates = pd.Series(df["date"].dropna().sort_values().unique())
    if len(unique_dates) < 3:
        return df.copy(), pd.DataFrame(), pd.DataFrame(), {
            "mode": "chronological",
            "calibration_start": None,
            "test_start": None,
            "test_end": None,
        }

    train_end = int(len(unique_dates) * TRAIN_RATIO)
    cal_end = int(len(unique_dates) * (TRAIN_RATIO + CALIBRATION_RATIO))
    train_end = min(max(train_end, 1), len(unique_dates) - 2)
    cal_end = min(max(cal_end, train_end + 1), len(unique_dates) - 1)

    train_cutoff = unique_dates.iloc[train_end]
    test_cutoff = unique_dates.iloc[cal_end]

    train_df = df[df["date"] < train_cutoff].copy()
    calibration_df = df[(df["date"] >= train_cutoff) & (df["date"] < test_cutoff)].copy()
    test_df = df[df["date"] >= test_cutoff].copy()
    return train_df, calibration_df, test_df, {
        "mode": "chronological",
        "calibration_start": train_cutoff,
        "test_start": test_cutoff,
        "test_end": None,
    }


def fixed_oos_train_cal_test_split(df: pd.DataFrame, window: dict[str, str]):
    train_end = pd.Timestamp(window["train_end"])
    test_start = pd.Timestamp(window["test_start"])
    test_end = pd.Timestamp(window["test_end"]) if window.get("test_end") else None

    train_df = df[df["date"] < train_end].copy()
    calibration_df = df[(df["date"] >= train_end) & (df["date"] < test_start)].copy()
    if test_end is None:
        test_df = df[df["date"] >= test_start].copy()
    else:
        test_df = df[(df["date"] >= test_start) & (df["date"] < test_end)].copy()

    return train_df, calibration_df, test_df, {
        "mode": "fixed_oos",
        "name": window["name"],
        "reason": window.get("reason", "fixed_oos_window"),
        "train_end": train_end,
        "calibration_start": train_end,
        "test_start": test_start,
        "test_end": test_end,
    }


def build_models() -> tuple[dict[str, Any], dict[str, Any], dict[str, Any]]:
    shared_params = dict(
        n_estimators=N_ESTIMATORS,
        max_depth=MAX_DEPTH,
        learning_rate=LEARNING_RATE,
        subsample=0.85,
        colsample_bytree=0.85,
        reg_alpha=0.1,
        reg_lambda=1.0,
        tree_method="hist",
        device="cuda",  # Membangunkan GPU RTX
        random_state=RANDOM_STATE,
        n_jobs=-1,
    )
    huber_params = dict(
        **shared_params,
        objective="reg:pseudohubererror",
        huber_slope=1.0,
    )
    tweedie_params = dict(
        **shared_params,
        objective="reg:tweedie",
        tweedie_variance_power=1.3,
    )
    quantile_params = dict(
        **shared_params,
        objective="reg:quantileerror",
        quantile_alpha=P85_ALPHA,
    )
    return huber_params, tweedie_params, quantile_params


def _train_evaluate_horizon(
    labeled: pd.DataFrame,
    horizon: int,
    target_col: str,
    split_result,
    params: tuple[dict[str, Any], dict[str, Any], dict[str, Any]],
    scenario_name: str,
    save_artifacts: bool,
) -> dict[str, Any] | None:
    huber_params, tweedie_params, quantile_params = params
    train_df, cal_df, test_df, split_metadata = split_result

    print(
        f"  [{scenario_name}] Train={len(train_df):,} | Cal={len(cal_df):,} | Test={len(test_df):,} | "
        f"Cal start={split_metadata.get('calibration_start')} | Test start={split_metadata.get('test_start')}"
    )

    if train_df.empty or cal_df.empty or test_df.empty:
        print(f"  [{scenario_name}] Skip: split produced an empty set")
        return None

    y_clip = float(train_df[target_col].quantile(TARGET_CLIP_QUANTILE))
    y_train = train_df[target_col].clip(upper=y_clip)
    y_cal = cal_df[target_col]
    y_test = test_df[target_col]

    X_train = train_df[FEATURES_ORDER]
    X_cal = cal_df[FEATURES_ORDER]
    X_test = test_df[FEATURES_ORDER]

    encoder = _make_target_encoder(
        cols=CATEGORICAL_FEATURES,
        smoothing=10,
        require_portable_artifact=save_artifacts,
    )
    X_train_enc = encoder.fit_transform(X_train, y_train)
    X_cal_enc = encoder.transform(X_cal)
    X_test_enc = encoder.transform(X_test)

    started_at = time.time()

    model_huber = SklearnCompatibleXGBRegressor(**huber_params)
    model_huber.fit(X_train_enc, y_train)

    model_tweedie = SklearnCompatibleXGBRegressor(**tweedie_params)
    model_tweedie.fit(X_train_enc, y_train)

    model_quantile = SklearnCompatibleXGBRegressor(**quantile_params)
    model_quantile.fit(X_train_enc, y_train)

    train_seconds = time.time() - started_at

    cal_huber = np.clip(model_huber.predict(X_cal_enc), 0, None)
    cal_tweedie = np.clip(model_tweedie.predict(X_cal_enc), 0, None)
    cal_raw_ensemble = (cal_huber + cal_tweedie) / 2.0

    calibrator = IsotonicRegression(y_min=0.0, out_of_bounds="clip")
    calibrator.fit(cal_raw_ensemble, y_cal.values.astype(float))
    cal_calibrated = np.clip(calibrator.predict(cal_raw_ensemble), 0, None)

    test_huber = np.clip(model_huber.predict(X_test_enc), 0, None)
    test_tweedie = np.clip(model_tweedie.predict(X_test_enc), 0, None)
    test_raw_ensemble = (test_huber + test_tweedie) / 2.0
    test_calibrated = np.clip(calibrator.predict(test_raw_ensemble), 0, None)

    cal_p85_raw = np.clip(model_quantile.predict(X_cal_enc), 0, None)
    test_p85_raw = np.clip(model_quantile.predict(X_test_enc), 0, None)
    test_p85_calibrated, p85_calibration_audit = _calibrate_quantile_to_coverage(
        y_cal,
        cal_p85_raw,
        test_p85_raw,
        P85_TARGET_COVERAGE,
    )

    raw_metrics = _as_metric_dict(y_test, test_raw_ensemble)
    calibrated_metrics = _as_metric_dict(y_test, test_calibrated)
    p85_raw_metrics = _as_metric_dict(y_test, test_p85_raw)
    p85_raw_metrics["pinball_loss_p85"] = float(mean_pinball_loss(y_test, test_p85_raw, alpha=P85_ALPHA))
    p85_raw_metrics["coverage"] = float(np.mean(np.asarray(y_test, dtype=float) <= test_p85_raw))
    p85_calibrated_metrics = _as_metric_dict(y_test, test_p85_calibrated)
    p85_calibrated_metrics["pinball_loss_p85"] = float(mean_pinball_loss(y_test, test_p85_calibrated, alpha=P85_ALPHA))
    p85_calibrated_metrics["coverage"] = float(np.mean(np.asarray(y_test, dtype=float) <= test_p85_calibrated))
    p85_calibrated_metrics["crossing_rate_vs_point_forecast"] = float(np.mean(test_p85_calibrated < test_calibrated))

    test_eval_df = test_df.copy()
    test_eval_df["pred_raw"] = test_raw_ensemble
    test_eval_df["pred_calibrated"] = test_calibrated
    test_eval_df["pred_p85_raw"] = test_p85_raw
    test_eval_df["pred_p85_calibrated"] = test_p85_calibrated

    print(f"  [{scenario_name}] Training time: {train_seconds:.1f}s")
    _print_metric_line("Raw ensemble", raw_metrics)
    _print_metric_line("Calibrated", calibrated_metrics)
    _print_metric_line("P85 calibrated", p85_calibrated_metrics)
    print(
        f"  [{scenario_name}] P85 coverage raw={p85_raw_metrics['coverage']:.3f} "
        f"calibrated={p85_calibrated_metrics['coverage']:.3f} "
        f"offset={p85_calibration_audit['additive_offset']:+.2f}"
    )

    if save_artifacts:
        joblib.dump(encoder, os.path.join(ARTIFACTS_DIR, f"encoder_aggressive_{horizon}d.joblib"))
        joblib.dump(model_huber, os.path.join(ARTIFACTS_DIR, f"huber_aggressive_{horizon}d.joblib"))
        joblib.dump(model_tweedie, os.path.join(ARTIFACTS_DIR, f"tweedie_aggressive_{horizon}d.joblib"))
        joblib.dump(model_quantile, os.path.join(ARTIFACTS_DIR, f"quantile_p85_aggressive_{horizon}d.joblib"))
        joblib.dump(calibrator, os.path.join(ARTIFACTS_DIR, f"isotonic_aggressive_{horizon}d.joblib"))

    return {
        "target": target_col,
        "target_definition": f"forward average demand over {horizon} days",
        "rows": {
            "train": len(train_df),
            "calibration": len(cal_df),
            "test": len(test_df),
        },
        "split_dates": split_metadata,
        "clip": {
            "quantile": TARGET_CLIP_QUANTILE,
            "upper": y_clip,
        },
        "training_seconds": train_seconds,
        "target_diagnostics_test": _target_diagnostics(y_test),
        "raw_ensemble": raw_metrics,
        "calibrated_ensemble": calibrated_metrics,
        "calibration_audit": _calibration_audit(
            calibrator,
            y_cal,
            cal_raw_ensemble,
            cal_calibrated,
            y_test,
            test_raw_ensemble,
            test_calibrated,
        ),
        "p85_quantile_raw": p85_raw_metrics,
        "p85_quantile_calibrated": p85_calibrated_metrics,
        "p85_calibration_audit": p85_calibration_audit,
        "segment_diagnostics": _segment_diagnostics(test_eval_df, target_col),
    }


def train_multi_horizon(df: pd.DataFrame) -> dict[int, dict[str, Any]]:
    print("\n" + "=" * 72)
    print("  TAHAP 3: TRAINING AGGRESSIVE C + AUDIT")
    print("=" * 72)

    params = build_models()
    metrics_by_horizon: dict[int, dict[str, Any]] = {}

    total_steps = len(HORIZONS)
    if RUN_OOS_AUDIT:
        total_steps += len(HORIZONS) * len(OOS_WINDOWS)

    current_step = 0
    start_time = time.time()

    for horizon in HORIZONS:
        target_col = f"avg_demand_{horizon}d"
        print(f"\n  ---- Horizon H+{horizon} ({target_col}) ----")

        labeled = df.dropna(subset=[target_col]).copy()
        labeled.sort_values(["date", "store_nbr", "family"], inplace=True)
        if labeled.empty:
            print("  Skip: no labeled rows")
            continue

        primary_result = _train_evaluate_horizon(
            labeled=labeled,
            horizon=horizon,
            target_col=target_col,
            split_result=chronological_train_cal_test_split(labeled),
            params=params,
            scenario_name="chronological",
            save_artifacts=SAVE_ARTIFACTS,
        )
        if primary_result is None:
            continue

        metrics_by_horizon[horizon] = primary_result
        current_step += 1

        elapsed_time = time.time() - start_time
        avg_time_per_step = elapsed_time / current_step
        remaining_steps = total_steps - current_step
        eta_seconds = remaining_steps * avg_time_per_step
        eta_minutes = eta_seconds / 60
        
        bar_length = 30
        progress = current_step / total_steps
        filled = int(bar_length * progress)
        bar = '█' * filled + '-' * (bar_length - filled)
        print(
            f"  [PROGRESS] |{bar}| {current_step}/{total_steps} "
            f"ETA: {eta_minutes:.1f}m"
        )

        if RUN_OOS_AUDIT:
            metrics_by_horizon[horizon]["oos_audits"] = {}
            for window in OOS_WINDOWS:
                scenario_name = f"oos_{window['name']}"
                oos_result = _train_evaluate_horizon(
                    labeled=labeled,
                    horizon=horizon,
                    target_col=target_col,
                    split_result=fixed_oos_train_cal_test_split(labeled, window),
                    params=params,
                    scenario_name=scenario_name,
                    save_artifacts=False,
                )
                current_step += 1
                elapsed_time = time.time() - start_time
                avg_time_per_step = elapsed_time / current_step
                remaining_steps = total_steps - current_step
                eta_seconds = remaining_steps * avg_time_per_step
                eta_minutes = eta_seconds / 60
                
                bar_length = 30
                progress = current_step / total_steps
                filled = int(bar_length * progress)
                bar = '█' * filled + '-' * (bar_length - filled)
                print(
                    f"  [PROGRESS] |{bar}| {current_step}/{total_steps} "
                    f"ETA: {eta_minutes:.1f}m"
                )

                if oos_result is not None:
                    metrics_by_horizon[horizon]["oos_audits"][window["name"]] = oos_result
                    if window["name"] == "jan_2017":
                        metrics_by_horizon[horizon]["oos_audit_jan2017"] = oos_result

    return metrics_by_horizon


def print_summary(metrics_by_horizon: dict[int, dict[str, Any]]) -> None:
    print("\n" + "=" * 72)
    print("  TAHAP 4: SUMMARY AGGRESSIVE")
    print("=" * 72)
    print(f"  {'Metric':<12} {'H+7':>11} {'H+14':>11} {'H+21':>11} {'H+28':>11}")
    print(f"  {'-' * 12} {'-' * 11} {'-' * 11} {'-' * 11} {'-' * 11}")

    for metric_name in ["mae", "rmse", "r2", "wape", "bias"]:
        values = []
        for horizon in HORIZONS:
            metrics = metrics_by_horizon.get(horizon, {}).get("calibrated_ensemble")
            values.append(f"{metrics[metric_name]:>11.4f}" if metrics else f"{'N/A':>11}")
        print(f"  {metric_name.upper():<12} {values[0]} {values[1]} {values[2]} {values[3]}")

    print("\n  P85 quantile diagnostics")
    print(f"  {'Metric':<12} {'H+7':>11} {'H+14':>11} {'H+21':>11} {'H+28':>11}")
    print(f"  {'-' * 12} {'-' * 11} {'-' * 11} {'-' * 11} {'-' * 11}")
    for metric_name in ["pinball_loss_p85", "coverage"]:
        values = []
        for horizon in HORIZONS:
            metrics = metrics_by_horizon.get(horizon, {}).get("p85_quantile_calibrated")
            values.append(f"{metrics[metric_name]:>11.4f}" if metrics else f"{'N/A':>11}")
        print(f"  {metric_name:<12} {values[0]} {values[1]} {values[2]} {values[3]}")

    if any(metrics_by_horizon.get(h, {}).get("oos_audits") for h in HORIZONS):
        print("\n  Fixed OOS calibrated WAPE")
        print(f"  {'Window':<24} {'H+7':>11} {'H+14':>11} {'H+21':>11} {'H+28':>11}")
        print(f"  {'-' * 24} {'-' * 11} {'-' * 11} {'-' * 11} {'-' * 11}")
        for window in OOS_WINDOWS:
            values = []
            for horizon in HORIZONS:
                metrics = (
                    metrics_by_horizon.get(horizon, {})
                    .get("oos_audits", {})
                    .get(window["name"], {})
                    .get("calibrated_ensemble")
                )
                values.append(f"{metrics['wape']:>11.4f}" if metrics else f"{'N/A':>11}")
            print(f"  {window['name']:<24} {values[0]} {values[1]} {values[2]} {values[3]}")

    if metrics_by_horizon:
        best_h = min(
            metrics_by_horizon,
            key=lambda h: metrics_by_horizon[h]["calibrated_ensemble"].get("wape", float("inf")),
        )
        best_wape = metrics_by_horizon[best_h]["calibrated_ensemble"]["wape"]
        print(f"\n  Best calibrated WAPE: H+{best_h} ({best_wape:.4f})")
    print(f"  Artifacts: {ARTIFACTS_DIR}")


def save_metadata(metrics_by_horizon: dict[int, dict[str, Any]], total_seconds: float) -> None:
    metadata = {
        "model_family": "stock_aggressive_c",
        "created_at": datetime.now(UTC).isoformat(),
        "total_seconds": total_seconds,
        "csv_dir": CSV_DIR,
        "artifacts_dir": ARTIFACTS_DIR,
        "sample_limit": SAMPLE_LIMIT,
        "features_order": FEATURES_ORDER,
        "categorical_features": CATEGORICAL_FEATURES,
        "horizons": HORIZONS,
        "p85_alpha": P85_ALPHA,
        "target_clip_quantile": TARGET_CLIP_QUANTILE,
        "p85_target_coverage": P85_TARGET_COVERAGE,
        "xgboost_params": {
            "n_estimators": N_ESTIMATORS,
            "max_depth": MAX_DEPTH,
            "learning_rate": LEARNING_RATE,
        },
        "save_artifacts": SAVE_ARTIFACTS,
        "audit": {
            "run_oos_audit": RUN_OOS_AUDIT,
            "oos_windows": OOS_WINDOWS,
            "segment_min_rows": SEGMENT_MIN_ROWS,
            "segment_top_n": SEGMENT_TOP_N,
        },
        "split": {
            "train_ratio": TRAIN_RATIO,
            "calibration_ratio": CALIBRATION_RATIO,
            "test_ratio": max(0.0, 1.0 - TRAIN_RATIO - CALIBRATION_RATIO),
        },
        "metrics": metrics_by_horizon,
        "artifact_files": sorted(os.listdir(ARTIFACTS_DIR)) if SAVE_ARTIFACTS else [],
    }

    metrics_path = os.path.join(ARTIFACTS_DIR, "metrics_aggressive.json")
    if SAVE_ARTIFACTS:
        with open(metrics_path, "w", encoding="utf-8") as f:
            json.dump(metadata, f, indent=2, default=_json_default)
        print(f"\n  Metrics JSON: {metrics_path}")
    else:
        print("\n  Metrics JSON skipped because STOCK_AGGRESSIVE_SKIP_SAVE=1")


if __name__ == "__main__":
    total_start = time.time()

    sales, stores, oil, holidays = load_csv_data()
    features = feature_engineering(sales, stores, oil, holidays)
    del sales, stores, oil, holidays
    gc.collect()

    metrics = train_multi_horizon(features)
    print_summary(metrics)

    total_time = time.time() - total_start
    save_metadata(metrics, total_time)
    print(f"\n  Total time: {total_time:.1f}s ({total_time / 60:.1f} minutes)")
