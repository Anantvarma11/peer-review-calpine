import app.database as app_db
from sqlalchemy import text
import logging

logging.basicConfig(level=logging.INFO)

def inspect_columns():
    app_db._init_engine()
    db = app_db.SessionLocal()
    views = [
        "customer",
        "fifteen_min_96_k",
        "hourly_24_k"
    ]
    
    try:
        with open("cols.txt", "w") as f:
            for view in views:
                try:
                    print(f"--- Inspecting {view} ---")
                    f.write(f"\n--- {view} ---\n")
                    
                    result = db.execute(text(f"SELECT * FROM {view} LIMIT 1"))
                    columns = list(result.keys())
                    row = result.fetchone()
                    
                    f.write(f"Columns: {columns}\n")
                    f.write(f"Row: {row}\n")
                    
                    print(f"COLUMNS: {columns}")
                    print(f"ROW: {row}")
                except Exception as e:
                    f.write(f"ERROR processing {view}: {e}\n")
                    print(f"ERROR processing {view}: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    inspect_columns()
