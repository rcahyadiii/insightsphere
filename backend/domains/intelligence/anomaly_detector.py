import pandas as pd
from sqlalchemy import select, func
from sqlalchemy.orm import Session
from sklearn.ensemble import IsolationForest
from typing import List, Dict, Any

from domains.sales.models import Transaction

class AnomalyDetector:
    def __init__(self, db_session: Session):
        self.db = db_session
        self.model = IsolationForest(contamination=0.05, random_state=42)
        self.model_version = "isoforest_v1.0"
        
    def fetch_transaction_patterns(self) -> pd.DataFrame:
        query = select(
            Transaction.branch_id,
            Transaction.date,
            func.count(Transaction.id).label('trx_count'),
            func.sum(Transaction.total_amount).label('total_amount')
        ).group_by(Transaction.branch_id, Transaction.date)
        
        results = self.db.execute(query).fetchall()
        if not results:
            return pd.DataFrame()
            
        return pd.DataFrame(results, columns=['branch_id', 'date', 'trx_count', 'total_amount'])

    def detect_anomalies(self) -> List[Dict[str, Any]]:
        df = self.fetch_transaction_patterns()
        if df.empty or len(df) < 5:
            return []
            
        print("[AnomalyDetector] Melatih model Isolation Forest...")
        X = df[['trx_count', 'total_amount']]
        df['anomaly_score'] = self.model.fit_predict(X)
        latest_date = df['date'].max()
        df_latest = df[df['date'] == latest_date]
        
        anomalies_log = []
        for _, row in df_latest.iterrows():
            is_anomaly = int(row['anomaly_score'])
            story = f"Aktivitas Cabang: {row['trx_count']} trx, Amt: {row['total_amount']}. {'NORMAL' if is_anomaly==1 else 'ANOMALI'}"
            
            anomalies_log.append({
                "branch_id": str(row['branch_id']),
                "predicted_for_date": pd.to_datetime(row['date']).date(),
                "prediction_type": "branch_anomaly",
                "predicted_value": float(is_anomaly), 
                "reasoning_text": story,
                "model_version": self.model_version
            })
            
        return anomalies_log
