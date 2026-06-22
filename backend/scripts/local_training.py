"""
=================================================================
  InsightSphere — Local ML Training (Tanpa PostgreSQL)
  Baca CSV Kaggle → Feature Engineering → 4 Model XGBoost → Metrik
=================================================================
"""
import gc
import os
import sys
import time
import pandas as pd
import numpy as np
import xgboost as xgb
import joblib
from datetime import datetime
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score

# Path setup
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
CSV_DIR = os.path.join(os.path.dirname(BASE_DIR), "store-sales-time-series-forecasting")
ARTIFACTS_DIR = os.path.join(BASE_DIR, "domains", "intelligence", "artifacts")
os.makedirs(ARTIFACTS_DIR, exist_ok=True)

HORIZONS = [7, 14, 21, 28]
SAMPLE_LIMIT = int(os.getenv("STOCK_TRAINING_LIMIT", "500000"))

FEATURES_ORDER = [
    'store_nbr', 'family', 'city', 'state', 'cluster',
    'rolling_7d_sales', 'is_weekend', 'days_since_payday',
    'lag_1', 'lag_2', 'lag_3', 'lag_7', 'day_of_week', 'is_month_end',
    'is_holiday_or_event', 'oil_price'
]
CATEGORICAL_FEATURES = ['store_nbr', 'family', 'city', 'state', 'cluster']


def load_csv_data():
    """Load semua file CSV Kaggle."""
    print("=" * 60)
    print("  📂 TAHAP 1: LOAD DATA DARI CSV")
    print("=" * 60)

    print(f"  ➜ Load train.csv...")
    df_sales = pd.read_csv(os.path.join(CSV_DIR, "train.csv"), usecols=['date', 'store_nbr', 'family', 'sales', 'onpromotion'])
    df_sales['date'] = pd.to_datetime(df_sales['date'])
    df_sales['store_nbr'] = df_sales['store_nbr'].astype('int16')
    df_sales['family'] = df_sales['family'].astype('category')
    df_sales['sales'] = df_sales['sales'].astype('float32')
    print(f"     {len(df_sales):,} baris loaded")

    print(f"  ➜ Load stores.csv...")
    df_stores = pd.read_csv(os.path.join(CSV_DIR, "stores.csv"))

    print(f"  ➜ Load oil.csv...")
    df_oil = pd.read_csv(os.path.join(CSV_DIR, "oil.csv"))
    df_oil.rename(columns={'dcoilwtico': 'oil_price'}, inplace=True)
    df_oil['date'] = pd.to_datetime(df_oil['date'])

    print(f"  ➜ Load holidays_events.csv...")
    df_holidays = pd.read_csv(os.path.join(CSV_DIR, "holidays_events.csv"))
    df_holidays['date'] = pd.to_datetime(df_holidays['date'])
    df_holidays = df_holidays[df_holidays['transferred'] == False].drop_duplicates(subset=['date']).copy()
    df_holidays['is_holiday_or_event'] = True
    df_holidays = df_holidays[['date', 'is_holiday_or_event']]

    return df_sales, df_stores, df_oil, df_holidays


def feature_engineering(df_sales, df_stores, df_oil, df_holidays):
    """Feature engineering — sama persis dengan pipeline produksi."""
    print("\n" + "=" * 60)
    print("  🔧 TAHAP 2: FEATURE ENGINEERING")
    print("=" * 60)

    # Cleansing histori mati
    print("  ➜ Cleansing histori mati...")
    first_sale = df_sales[df_sales['sales'] > 0].groupby(['store_nbr', 'family'])['date'].min().reset_index()
    first_sale.rename(columns={'date': 'first_sale_date'}, inplace=True)
    initial_len = len(df_sales)
    df_sales = df_sales.merge(first_sale, on=['store_nbr', 'family'], how='left')
    df_sales = df_sales[df_sales['first_sale_date'].notna()]
    df_sales = df_sales[df_sales['date'] >= df_sales['first_sale_date']]
    df_sales.drop(columns=['first_sale_date'], inplace=True)
    print(f"     Terhapus {(initial_len - len(df_sales)):,} baris. Sisa: {len(df_sales):,}")

    # Merge metadata
    print("  ➜ Merging stores metadata...")
    df_sales = df_sales.merge(df_stores[['store_nbr', 'city', 'state', 'cluster']], on='store_nbr', how='left')
    del df_stores; gc.collect()

    print("  ➜ Merging oil prices...")
    df_sales = df_sales.merge(df_oil, on='date', how='left')
    df_sales.sort_values(by='date', inplace=True)
    df_sales['oil_price'] = df_sales['oil_price'].ffill().astype('float32')
    del df_oil; gc.collect()

    print("  ➜ Merging holidays...")
    df_sales = df_sales.merge(df_holidays, on='date', how='left')
    df_sales['is_holiday_or_event'] = df_sales['is_holiday_or_event'].fillna(False).astype(bool)
    del df_holidays; gc.collect()

    # Calendar features
    df_sales['is_weekend'] = df_sales['date'].dt.weekday >= 5
    df_sales['day_of_week'] = df_sales['date'].dt.weekday.astype('int8')
    df_sales['is_month_end'] = df_sales['date'].dt.is_month_end

    def calc_payday(d):
        if d.day == 15 or d.is_month_end: return 0
        elif d.day < 15: return d.day
        else: return d.day - 15

    unique_dates = pd.Series(df_sales['date'].unique())
    days_map = pd.DataFrame({'date': unique_dates, 'days_since_payday': unique_dates.apply(calc_payday).astype('int16')})
    df_sales = df_sales.merge(days_map, on='date', how='left')
    del days_map; gc.collect()

    # Lag & Rolling
    print("  ➜ Menghitung Lags & Rolling...")
    df_sales.sort_values(['store_nbr', 'family', 'date'], inplace=True)
    grouped = df_sales.groupby(['store_nbr', 'family'])['sales']
    df_sales['lag_1'] = grouped.shift(1).astype('float32')
    df_sales['lag_2'] = grouped.shift(2).astype('float32')
    df_sales['lag_3'] = grouped.shift(3).astype('float32')
    df_sales['lag_7'] = grouped.shift(7).astype('float32')
    df_sales['rolling_7d_sales'] = grouped.transform(lambda x: x.shift(1).rolling(7, min_periods=1).mean()).astype('float32')

    # Multi-Horizon Targets
    print("  ➜ Menghitung Multi-Horizon Targets (7/14/21/28 hari)...")
    for h in HORIZONS:
        col = f'avg_demand_{h}d'
        df_sales[col] = grouped.transform(
            lambda x: x.shift(-1).rolling(window=h, min_periods=max(1, h // 2)).mean()
        ).astype('float32')
        valid = df_sales[col].notna().sum()
        print(f"     {col}: {valid:,} baris valid")

    # Sampling
    if SAMPLE_LIMIT and len(df_sales) > SAMPLE_LIMIT:
        df_sales = df_sales.sort_values('date', ascending=False).head(SAMPLE_LIMIT).copy()
        df_sales.sort_values(['date', 'store_nbr', 'family'], inplace=True)
        print(f"  ➜ Sampled ke {SAMPLE_LIMIT:,} baris (data terbaru)")

    print(f"\n  ✅ Feature Engineering selesai: {len(df_sales):,} baris, {len(df_sales.columns)} kolom")
    return df_sales


def train_multi_horizon(df):
    """Train 4 model XGBoost — 1 per horizon."""
    import category_encoders as ce

    print("\n" + "=" * 60)
    print("  🧠 TAHAP 3: TRAINING MODEL (Multi-Horizon Direct)")
    print("=" * 60)

    encoder = None
    models = {}
    all_metrics = {}

    for h in HORIZONS:
        target_col = f'avg_demand_{h}d'
        print(f"\n  ──── Horizon H+{h} ({target_col}) ────")

        labeled = df.dropna(subset=[target_col]).copy()
        labeled.sort_values(['date', 'store_nbr', 'family'], inplace=True)

        if labeled.empty:
            print(f"  ⚠️ Tidak ada data target. Skip.")
            continue

        # Chronological split 80/20
        unique_dates = labeled['date'].sort_values().unique()
        split_idx = int(len(unique_dates) * 0.8)
        split_date = unique_dates[split_idx]
        train_df = labeled[labeled['date'] < split_date]
        test_df = labeled[labeled['date'] >= split_date]

        print(f"  Train: {len(train_df):,} rows | Test: {len(test_df):,} rows | Split: {split_date}")

        # Clipping outlier dari Train Set saja
        p99 = train_df[target_col].quantile(0.999)
        train_df = train_df.copy()
        test_df = test_df.copy()
        train_df[target_col] = train_df[target_col].clip(upper=p99)
        test_df[target_col] = test_df[target_col].clip(upper=p99)

        X_train, y_train = train_df[FEATURES_ORDER], train_df[target_col]
        X_test, y_test = test_df[FEATURES_ORDER], test_df[target_col]

        # Encoder: fit sekali, transform semua
        if encoder is None:
            encoder = ce.TargetEncoder(cols=CATEGORICAL_FEATURES, smoothing=10)
            X_train_enc = encoder.fit_transform(X_train, y_train)
        else:
            X_train_enc = encoder.transform(X_train)
        X_test_enc = encoder.transform(X_test)

        # Train XGBoost
        t0 = time.time()
        model = xgb.XGBRegressor(
            n_estimators=100, max_depth=5, learning_rate=0.05,
            objective='reg:tweedie', tweedie_variance_power=1.5,
            random_state=42, n_jobs=-1
        )
        model.fit(X_train_enc, y_train)
        train_time = time.time() - t0
        models[h] = model

        # Evaluate
        preds = np.clip(model.predict(X_test_enc), 0, None)
        y_test_arr = y_test.values.astype(float)
        abs_err = np.abs(y_test_arr - preds)
        denom = np.sum(np.abs(y_test_arr))

        metrics = {
            "MAE": mean_absolute_error(y_test_arr, preds),
            "RMSE": np.sqrt(mean_squared_error(y_test_arr, preds)),
            "R²": r2_score(y_test_arr, preds) if np.var(y_test_arr) > 0 else 0.0,
            "WAPE": abs_err.sum() / denom if denom > 0 else 0.0,
            "Bias": np.mean(preds - y_test_arr),
            "P95 Error": np.quantile(abs_err, 0.95) if len(abs_err) > 0 else 0.0,
        }
        all_metrics[h] = metrics

        print(f"  ⏱️  Training time: {train_time:.1f}s")
        print(f"  ┌──────────────────────────────────┐")
        print(f"  │  MAE       : {metrics['MAE']:>12.4f}       │")
        print(f"  │  RMSE      : {metrics['RMSE']:>12.4f}       │")
        print(f"  │  R²        : {metrics['R²']:>12.4f}       │")
        print(f"  │  WAPE      : {metrics['WAPE']:>12.4f}       │")
        print(f"  │  Bias      : {metrics['Bias']:>12.4f}       │")
        print(f"  │  P95 Error : {metrics['P95 Error']:>12.4f}       │")
        print(f"  └──────────────────────────────────┘")

    # Persist models
    print(f"\n💾 Menyimpan model ke {ARTIFACTS_DIR}...")
    joblib.dump(encoder, os.path.join(ARTIFACTS_DIR, "encoder.joblib"))
    for h in HORIZONS:
        if h in models:
            joblib.dump(models[h], os.path.join(ARTIFACTS_DIR, f"model_{h}d.joblib"))
            print(f"  ✔ model_{h}d.joblib")

    return models, encoder, all_metrics


def print_summary(all_metrics):
    """Print ringkasan perbandingan semua horizon."""
    print("\n" + "=" * 60)
    print("  📊 TAHAP 4: RINGKASAN PERBANDINGAN HORIZON")
    print("=" * 60)

    print(f"\n  {'Metrik':<12} {'H+7':>10} {'H+14':>10} {'H+21':>10} {'H+28':>10}")
    print(f"  {'─'*12} {'─'*10} {'─'*10} {'─'*10} {'─'*10}")

    for metric_name in ["MAE", "RMSE", "R²", "WAPE", "Bias"]:
        vals = []
        for h in HORIZONS:
            if h in all_metrics:
                vals.append(f"{all_metrics[h][metric_name]:>10.4f}")
            else:
                vals.append(f"{'N/A':>10}")
        print(f"  {metric_name:<12} {vals[0]} {vals[1]} {vals[2]} {vals[3]}")

    # Best horizon
    if all_metrics:
        best_h = min(all_metrics, key=lambda h: all_metrics[h].get("WAPE", 999))
        print(f"\n  🏆 Best WAPE: H+{best_h} ({all_metrics[best_h]['WAPE']:.4f})")

    print(f"\n  Model artifacts tersimpan di: {ARTIFACTS_DIR}")
    print("=" * 60)


if __name__ == "__main__":
    total_start = time.time()

    # Step 1: Load
    df_sales, df_stores, df_oil, df_holidays = load_csv_data()

    # Step 2: Feature Engineering
    df = feature_engineering(df_sales, df_stores, df_oil, df_holidays)
    del df_sales; gc.collect()

    # Step 3: Train
    models, encoder, all_metrics = train_multi_horizon(df)

    # Step 4: Summary
    print_summary(all_metrics)

    total_time = time.time() - total_start
    print(f"\n  ⏱️  Total waktu: {total_time:.1f}s ({total_time/60:.1f} menit)")
