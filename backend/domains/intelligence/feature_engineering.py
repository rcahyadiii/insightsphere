"""
Feature Engineering v10 — Aggressive Optimization.
Penambahan: onpromotion, rolling_7d_std, lag_14, lag_30, rolling_14d/30d,
days_to_next_holiday, store_type.
"""
import gc
import os
import pandas as pd
import numpy as np
from datetime import datetime
from io import StringIO
from sqlalchemy import text

from core.database import engine

def generate_big_data_features():
    print("🚀 [Mulai Feature Engineering v10] Menarik data dari PostgreSQL...")
    
    # =========================================================
    # 1. MEMORY-SAFE EXTRACTION
    # =========================================================
    print("  ➜ Load Stores metadata...")
    df_stores = pd.read_sql("SELECT store_nbr, city, state, cluster, type as store_type FROM stores", engine)
    
    print("  ➜ Load Oil Prices...")
    df_oil = pd.read_sql("SELECT date, dcoilwtico as oil_price FROM oil_prices", engine)
    df_oil['date'] = pd.to_datetime(df_oil['date'])
    
    print("  ➜ Load Holiday Events (Drop Duplicates)...")
    query_holidays = "SELECT date FROM holiday_events WHERE transferred = False"
    df_holidays = pd.read_sql(query_holidays, engine)
    df_holidays['date'] = pd.to_datetime(df_holidays['date'])
    df_holidays = df_holidays.drop_duplicates(subset=['date']).copy()
    df_holidays['is_holiday_or_event'] = True
    
    print("  ➜ Load Sales Transactions (termasuk onpromotion)...")
    query_sales = "SELECT date, store_nbr, family, sales, onpromotion FROM sales_transactions"
    df_sales = pd.read_sql(query_sales, engine)
    
    if df_sales.empty:
        print("⚠️ Tabel Sales Transactions masih kosong.")
        return

    print("  ➜ Downcasting tipe data...")
    df_sales['date'] = pd.to_datetime(df_sales['date'])
    df_sales['store_nbr'] = df_sales['store_nbr'].astype('int16')
    df_sales['family'] = df_sales['family'].astype('category')
    df_sales['sales'] = df_sales['sales'].astype('float32')
    df_sales['onpromotion'] = pd.to_numeric(df_sales['onpromotion'], errors='coerce').fillna(0).astype('float32')

    # =========================================================
    # 1.5 DATA CLEANSING 
    # =========================================================
    print("🧹 [Data Preparation] Cleansing histori mati...")
    
    first_sale_dates = df_sales[df_sales['sales'] > 0].groupby(['store_nbr', 'family'])['date'].min().reset_index()
    first_sale_dates.rename(columns={'date': 'first_sale_date'}, inplace=True)
    
    initial_len = len(df_sales)
    df_sales = df_sales.merge(first_sale_dates, on=['store_nbr', 'family'], how='left')
    df_sales = df_sales[df_sales['first_sale_date'].notna()] 
    df_sales = df_sales[df_sales['date'] >= df_sales['first_sale_date']]
    df_sales.drop(columns=['first_sale_date'], inplace=True)
    
    final_len = len(df_sales)
    print(f"  ➜ Terhapus {(initial_len - final_len):,} baris histori mati. Sisa data: {final_len:,}")

    # =========================================================
    # 2. MERGING MAKRO-EKONOMI & METADATA TOKO
    # =========================================================
    print("🔗 Merging metadata (termasuk store_type)...")
    df_sales = df_sales.merge(df_stores, on='store_nbr', how='left')
    del df_stores
    gc.collect() 
    
    df_sales = df_sales.merge(df_oil, on='date', how='left')
    df_sales.sort_values(by='date', inplace=True)
    df_sales['oil_price'] = df_sales['oil_price'].ffill().astype('float32')
    del df_oil
    gc.collect()

    # =========================================================
    # 3. MERGING KALENDER LIBURAN & PAYDAY LOGIC
    # =========================================================
    print("🌴 Merging event Liburan & Kalender Ekuador...")
    df_sales = df_sales.merge(df_holidays, on='date', how='left')
    df_sales['is_holiday_or_event'] = df_sales['is_holiday_or_event'].notna()
    
    # ── days_to_next_holiday ──
    print("📅 Menghitung days_to_next_holiday...")
    holiday_dates = df_holidays['date'].sort_values().unique()
    all_dates = df_sales['date'].sort_values().unique()
    
    dtnh_map = {}
    h_idx = 0
    for d in all_dates:
        while h_idx < len(holiday_dates) and holiday_dates[h_idx] < d:
            h_idx += 1
        if h_idx < len(holiday_dates):
            dtnh_map[d] = (holiday_dates[h_idx] - d).days
        else:
            dtnh_map[d] = 30  # Default: lebih dari sebulan

    df_sales['days_to_next_holiday'] = df_sales['date'].map(dtnh_map).fillna(30).astype('int16')
    
    del df_holidays
    gc.collect()
    
    df_sales['is_weekend'] = df_sales['date'].dt.weekday >= 5
    df_sales['day_of_week'] = df_sales['date'].dt.weekday.astype('int8')
    df_sales['is_month_end'] = df_sales['date'].dt.is_month_end

    def calculate_days_since_payday(d):
        if d.day == 15 or d.is_month_end:
            return 0
        elif d.day < 15:
            prev_payday = d - pd.Timedelta(days=d.day) 
            return (d - prev_payday).days
        else: 
            prev_payday = d.replace(day=15)
            return (d - prev_payday).days

    unique_dates = pd.Series(df_sales['date'].unique())
    days_since_map = pd.DataFrame({
        'date': unique_dates,
        'days_since_payday': unique_dates.apply(calculate_days_since_payday).astype('int16')
    })
    
    df_sales = df_sales.merge(days_since_map, on='date', how='left')
    del days_since_map
    gc.collect()

    # =========================================================
    # 4. LAG & ROLLING FEATURES (Extended v10)
    # =========================================================
    print("⏳ Menghitung Lags (1,2,3,7,14,30) & Rolling (7d,14d,30d + volatility)...")
    df_sales.sort_values(['store_nbr', 'family', 'date'], inplace=True)
    
    grouped = df_sales.groupby(['store_nbr', 'family'])['sales']
    
    # Original lags
    df_sales['lag_1'] = grouped.shift(1).astype('float32')
    df_sales['lag_2'] = grouped.shift(2).astype('float32')
    df_sales['lag_3'] = grouped.shift(3).astype('float32')
    df_sales['lag_7'] = grouped.shift(7).astype('float32')
    
    # v10: Medium-term lags
    df_sales['lag_14'] = grouped.shift(14).astype('float32')
    df_sales['lag_30'] = grouped.shift(30).astype('float32')
    
    # v10: Extended rolling windows
    df_sales['rolling_7d_sales'] = grouped.transform(
        lambda x: x.shift(1).rolling(window=7, min_periods=1).mean()
    ).astype('float32')
    df_sales['rolling_14d_sales'] = grouped.transform(
        lambda x: x.shift(1).rolling(window=14, min_periods=3).mean()
    ).astype('float32')
    df_sales['rolling_30d_sales'] = grouped.transform(
        lambda x: x.shift(1).rolling(window=30, min_periods=7).mean()
    ).astype('float32')
    
    # v10: Volatility signal
    df_sales['rolling_7d_std'] = grouped.transform(
        lambda x: x.shift(1).rolling(window=7, min_periods=2).std()
    ).fillna(0).astype('float32')

    # =========================================================
    # 4.5 MULTI-HORIZON TARGETS (Direct Approach)
    # =========================================================
    print("🎯 Menghitung Multi-Horizon Targets (7/14/21/28 hari)...")
    
    for horizon in [7, 14, 21, 28]:
        col_name = f'avg_demand_{horizon}d'
        df_sales[col_name] = grouped.transform(
            lambda x: x.shift(-1).rolling(window=horizon, min_periods=max(1, horizon // 2)).mean()
        ).astype('float32')
        valid_count = df_sales[col_name].notna().sum()
        print(f"  ➜ {col_name}: {valid_count:,} baris valid")

    # =========================================================
    # 5. FAST BULK INSERT VIA POSTGRESQL COPY 
    # =========================================================
    print(f"\n📥 [Tahap Akhir] Menyimpan {len(df_sales):,} matriks Fitur v10 menggunakan COPY...")
    
    with engine.begin() as conn:
        conn.execute(text("TRUNCATE TABLE ml_feature_store"))
        
    conn = engine.raw_connection()
    cursor = conn.cursor()
    
    try:
        chunksize = 200000
        total_processed = 0
        cols_to_write = [
            'store_nbr', 'family', 'date', 'rolling_7d_sales', 'is_weekend', 
            'days_since_payday', 'lag_1', 'lag_2', 'lag_3', 'lag_7', 
            'day_of_week', 'is_month_end', 'is_holiday_or_event', 
            'oil_price', 'cluster', 'city', 'state', 'last_updated',
            'avg_demand_7d', 'avg_demand_14d', 'avg_demand_21d', 'avg_demand_28d',
            # v10 new columns
            'onpromotion', 'rolling_7d_std', 'lag_14', 'lag_30',
            'rolling_14d_sales', 'rolling_30d_sales', 'days_to_next_holiday', 'store_type'
        ]
        
        for i in range(0, len(df_sales), chunksize):
            chunk = df_sales.iloc[i : i + chunksize].copy()
            buffer = StringIO()
            
            chunk['last_updated'] = pd.Timestamp.utcnow().strftime('%Y-%m-%d %H:%M:%S+00:00')
            chunk['date'] = chunk['date'].dt.date
            
            chunk.to_csv(
                buffer, 
                columns=cols_to_write, 
                index=False, header=False, sep='\t', na_rep='\\N'
            )
            buffer.seek(0)
            
            cursor.copy_from(
                buffer, 
                'ml_feature_store', 
                sep='\t', 
                null='\\N', 
                columns=tuple(cols_to_write)
            )
            conn.commit()
            total_processed += len(chunk)
            print(f"  👉 Disimpan [Chunk {i//chunksize + 1}] - Total: {total_processed:,} baris.")
            
        print("\n🎉 Transformasi Fitur v10 Berhasil! (24 fitur + 4 target multi-horizon)")
        
    except Exception as e:
        conn.rollback()
        print(f"❌ Error DB COPY: {e}")
        raise e
    finally:
        cursor.close()
        conn.close()

if __name__ == "__main__":
    generate_big_data_features()
