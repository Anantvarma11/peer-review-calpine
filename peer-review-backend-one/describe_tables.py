"""
Describe actual tables in workspace.askcal-analytics-dev
"""
import app.database as db
from sqlalchemy import text
import os

# Override catalog/schema temporarily
os.environ["DATABRICKS_CATALOG"] = "workspace"
os.environ["DATABRICKS_SCHEMA"] = "askcal-analytics-dev"

def describe_tables():
    # Force reload
    db._engine = None
    db._init_engine()
    session = db.SessionLocal()
    
    tables = ["customer", "contract", "hourly_24_k", "fifteen_min_96_k", "psa_weather_city_forecast"]
    
    try:
        for table in tables:
            print(f"\n=== DESCRIBE {table} ===")
            try:
                result = session.execute(text(f"DESCRIBE `workspace`.`askcal-analytics-dev`.`{table}`"))
                for row in result.fetchall():
                    print(f"  {row[0]:30} {row[1]}")
            except Exception as e:
                print(f"  Error: {e}")
                
    finally:
        session.close()

if __name__ == "__main__":
    describe_tables()
