import os
import sys

sys.path.append(os.path.dirname(os.path.abspath(__file__)))
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import pandas as pd
from database import SessionLocal
from mlops.feature_engineering import generate_big_data_features
from mlops.stock_predictor import StockPredictor
from mlops.anomaly_detector import AnomalyDetector

def manual_test():
    print("\n" + "="*50)
    print("🪄 1. MENJALANKAN KAGGLE BIG DATA FEATURE ENGINEERING (EKSTRAKSI)")
    print("="*50)
    generate_big_data_features()
    
    db = SessionLocal()
    
    print("\n" + "="*50)
    print("📊 2. MELIHAT BENTUK DATA YANG AKAN DIPELAJARI AI (XGBOOST/LIGHTGBM)")
    print("="*50)
    predictor = StockPredictor(db)
    df_stock = predictor.fetch_data()
    print(f"Total Data Fitur yang ditarik untuk sampling tes: {len(df_stock)} baris.\n")
    print("Berikut adalah 5 Baris Pertama Datanya:")
    print(df_stock.head().to_string())
    
    predictor.train_if_needed(df_stock)
    
    if not df_stock.empty and predictor.model is not None and predictor.encoder is not None:
        latest_date = df_stock['date'].max()
        df_latest = df_stock[df_stock['date'] == latest_date].copy()
        if not df_latest.empty:
            X_infer = df_latest[predictor.features_order]
            X_infer_encoded = predictor.encoder.transform(X_infer)
            preds = predictor.predict_non_negative(X_infer_encoded)
            shap_vals = predictor.explainer(X_infer_encoded) if predictor.explainer is not None else None
            
            print("\n" + "="*50)
            print("🗣️ 4. HASIL PREDIKSI & CERITA AI (SHAP EXPLAINABLE AI)")
            print("="*50)
            for i in range(min(5, len(df_latest))):
                row = df_latest.iloc[i]
                pred_val = float(preds[i])
                recommended_stock, safety_stock_buffer, _ = predictor.recommend_stock(row, pred_val)
                row_shap_values = shap_vals[i] if shap_vals is not None else None
                story = predictor.generate_human_story(
                    row, row_shap_values, pred_val, recommended_stock, safety_stock_buffer
                )
                print(f"📌 Cabang (Store): {row['store_nbr']} | Kategori (Family): {row['family']}")
                print(f"   🤖 Opini AI: {story}\n")
    
    db.close()
    print("="*50)
    print("✅ PENGUJIAN MANUAL SELESAI")
    print("="*50 + "\n")

if __name__ == "__main__":
    import warnings
    warnings.filterwarnings('ignore') 
    manual_test()
