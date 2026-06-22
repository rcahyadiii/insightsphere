import pandas as pd
from sqlalchemy.orm import Session
from datetime import datetime, timedelta, timezone
from io import StringIO
import sys
import os

sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from core.database import SessionLocal, engine, Base
from domains.dataset.models import Store, HolidayEvent, OilPrice, SalesTransaction

def get_utc_now():
    return datetime.now(timezone.utc)

def reinitialize_db():
    print("🔄 Menghapus dan membuat ulang tabel database (Kaggle Schema)...")
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    print("✅ Skema database berhasil dibuat.")

def seed_kaggle_dataset():
    db = SessionLocal()
    try:
        # Menghubungkan ke folder dataset baru
        data_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'store-sales-time-series-forecasting')
        
        # --- 1. Seed Stores ---
        stores_file = os.path.join(data_dir, 'stores.csv')
        if os.path.exists(stores_file):
            print("📦 Memasukkan data Stores (stores.csv)...")
            df_stores = pd.read_csv(stores_file)
            stores_records = df_stores.to_dict('records')
            db.bulk_insert_mappings(Store, stores_records)
            db.commit()
            print(f"✔ Berhasil load {len(stores_records)} Stores.")
        else:
            print(f"⚠️ Peringatan: {stores_file} tidak ditemukan!")

        # --- 2. Seed Holiday Events ---
        holidays_file = os.path.join(data_dir, 'holidays_events.csv')
        if os.path.exists(holidays_file):
            print("🚢 Memasukkan data Holidays (holidays_events.csv)...")
            df_holidays = pd.read_csv(holidays_file)
            df_holidays['date'] = pd.to_datetime(df_holidays['date']).dt.date
            # Preprocessing rename kolom bila perlu dll
            holidays_records = df_holidays.to_dict('records')
            db.bulk_insert_mappings(HolidayEvent, holidays_records)
            db.commit()
            print(f"✔ Berhasil load {len(holidays_records)} Holiday Events.")
            
        # --- 3. Seed Oil Price ---
        oil_file = os.path.join(data_dir, 'oil.csv')
        if os.path.exists(oil_file):
            print("🛢️ Memasukkan data Oil Price (oil.csv)...")
            df_oil = pd.read_csv(oil_file)
            df_oil['date'] = pd.to_datetime(df_oil['date']).dt.date
            # Imputasi sederhana jika ada null (pada Feature Engineering akan diforward-fill)
            df_oil['dcoilwtico'] = df_oil['dcoilwtico'].fillna(0.0) 
            oil_records = df_oil.to_dict('records')
            db.bulk_insert_mappings(OilPrice, oil_records)
            db.commit()
            print(f"✔ Berhasil load {len(oil_records)} Oil Prices.")

        # --- 4. Big Data Ingestion: Sales Transactions (train.csv) ---
        train_file = os.path.join(data_dir, 'train.csv')
        if os.path.exists(train_file):
            print("🚀 Memulai proses Big Data Ingestion untuk SalesTransaction (train.csv)...")
            
            # --- [MEMORY OPTIMIZATION] ---
            dtypes = {
                'id': 'int32',          # Digunakan sebagai kaggle_id
                'store_nbr': 'int16',   # Toko cuma 54, aman dengan int16
                'family': 'category',   # Kategori produk, sangat hemat RAM
                'sales': 'float32',     # Mengurangi beban float64
                'onpromotion': 'int32'      
            }
            
            conn = engine.raw_connection()
            cursor = conn.cursor()
            
            try:
                chunksize = 100000 # Kita telan per 100 Ribu baris
                total_processed = 0
                start_time = datetime.now()
                
                # Iterasi Bulk Process
                for i, chunk in enumerate(pd.read_csv(train_file, chunksize=chunksize, dtype=dtypes)):
                    chunk_start = datetime.now()
                    
                    # Buffer Memory berbasis String untuk injeksi PostgreSQL COPY
                    buffer = StringIO()
                    
                    # Convert date format agar kompatibel dengan COPY (yyyy-mm-dd)
                    chunk['date'] = pd.to_datetime(chunk['date']).dt.date
                    
                    # Filter & Write kolom ke buffer string in-memory
                    # Urutan sama persis mengikuti kolom db -> ('kaggle_id', 'date', 'store_nbr', 'family', 'sales', 'onpromotion')
                    chunk.to_csv(
                        buffer, 
                        columns=['id', 'date', 'store_nbr', 'family', 'sales', 'onpromotion'], 
                        index=False, 
                        header=False, 
                        sep='\t', 
                        na_rep='\\N'
                    )
                    buffer.seek(0)
                    
                    # --- [HIGH-SPEED BULK INSERT VIA psycopg2] ---
                    try:
                        cursor.copy_from(
                            buffer, 
                            'sales_transactions',  # Nama tabel di database psycopg / models.py
                            sep='\t', 
                            null='\\N', 
                            columns=('kaggle_id', 'date', 'store_nbr', 'family', 'sales', 'onpromotion')
                        )
                        conn.commit()
                        
                        total_processed += len(chunk)
                        chunk_time = (datetime.now() - chunk_start).total_seconds()
                        
                        # --- [OBSERVABILITY] ---
                        print(f"  👉 [Chunk {i+1}] {len(chunk):,} baris ditelan dalam {chunk_time:.2f} detik. Total: {total_processed:,}")
                        
                    except Exception as chunk_e:
                        conn.rollback()
                        print(f"❌ Error insert pada Chunk {i+1}: {chunk_e}")
                        raise chunk_e
                        
                total_time = (datetime.now() - start_time).total_seconds()
                print(f"🎉 [BIG DATA PIPELINE SELESAI] Sebanyak {total_processed:,} baris Transaction sukses masuk DB PostgreSQL dalam {total_time:.2f} detik!")
                
            finally:
                cursor.close()
                conn.close()
        else:
            print(f"⚠️ File dataset raksasa tidak ditemukan: {train_file}")

    except Exception as e:
        print(f"❌ Terjadi kesalahan Seed Global: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    reinitialize_db()
    seed_kaggle_dataset()