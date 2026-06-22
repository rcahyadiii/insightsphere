"""Stock predictor business and model constants."""

import os

MODEL_ARTIFACTS_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "artifacts")

STOCK_PREDICTOR_HORIZONS = [7, 14, 21, 28]

STOCK_FEATURE_COLUMNS = [
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

STOCK_CATEGORICAL_FEATURES = [
    "store_nbr",
    "family",
    "city",
    "state",
    "cluster",
    "store_type",
]

DEFAULT_TRAINING_SAMPLE_LIMIT = 500_000
DEFAULT_SAFETY_STOCK_QUANTILE = 0.85
MIN_SAFETY_STOCK_QUANTILE = 0.50
MAX_SAFETY_STOCK_QUANTILE = 0.95
TRAIN_TEST_SPLIT_RATIO = 0.8
TARGET_CLIP_QUANTILE = 0.9995
MIN_ERROR_BUFFER_SEGMENT_SIZE = 5
ENSEMBLE_MODEL_WEIGHT = 2.0
SHAP_EXPLAINER_HORIZON = 7

STOCK_HUBER_PARAMS = dict(
    n_estimators=300,
    max_depth=7,
    learning_rate=0.03,
    objective="reg:pseudohubererror",
    huber_slope=1.0,
    subsample=0.85,
    colsample_bytree=0.85,
    reg_alpha=0.1,
    reg_lambda=1.0,
    random_state=42,
    n_jobs=-1,
)

STOCK_TWEEDIE_PARAMS = dict(
    n_estimators=300,
    max_depth=7,
    learning_rate=0.03,
    objective="reg:tweedie",
    tweedie_variance_power=1.3,
    subsample=0.85,
    colsample_bytree=0.85,
    reg_alpha=0.1,
    reg_lambda=1.0,
    random_state=42,
    n_jobs=-1,
)
