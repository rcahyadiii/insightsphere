import os
import sys
from sqlalchemy import text
from database import engine

with engine.connect() as conn:
    result = conn.execute(text("""
        SELECT model_name, metric_name, metric_value, evaluated_at, store_nbr 
        FROM ai_model_metrics 
        ORDER BY evaluated_at DESC LIMIT 10
    """))
    rows = result.fetchall()
    
    print("\n" + "="*55)
    print(" DATA METRIK DI POSTGRESQL (Tabel ai_model_metrics)")
    print("="*55)
    for r in rows:
        scope = "Global" if r.store_nbr is None else f"Cabang {r.store_nbr}"
        print(f"[{r.evaluated_at.strftime('%Y-%m-%d %H:%M:%S')}] | Scope: {scope:6s} | {r.metric_name:4s} : {r.metric_value:.4f}")
    
    if not rows:
        print("Tabel masih kosong!")
    print("="*55 + "\n")
