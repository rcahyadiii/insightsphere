from sqlalchemy import create_engine, text
from database import SQLALCHEMY_DATABASE_URL

engine = create_engine(SQLALCHEMY_DATABASE_URL)
with engine.connect() as conn:
    try:
        conn.execute(text("ALTER TABLE ai_model_metrics DROP CONSTRAINT IF EXISTS ai_model_metrics_store_nbr_fkey;"))
        conn.execute(text("ALTER TABLE ai_model_metrics ALTER COLUMN store_nbr DROP NOT NULL;"))
        conn.commit()
        print("Database Altered. Constraints on ai_model_metrics removed successfully.")
    except Exception as e:
        print(f"Warning: {e}")
