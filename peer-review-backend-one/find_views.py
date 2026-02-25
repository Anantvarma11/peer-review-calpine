"""
Query workspace.information_schema for tables/views
"""
import os
os.environ["DATABRICKS_CATALOG"] = "workspace"
os.environ["DATABRICKS_SCHEMA"] = "information_schema"

import app.database as db
from sqlalchemy import text

def find_all_views():
    db._engine = None
    db._init_engine()
    session = db.SessionLocal()
    
    try:
        print("=== All tables/views in workspace catalog ===\n")
        
        # Query all tables including views
        result = session.execute(text("""
            SELECT table_schema, table_name, table_type 
            FROM workspace.information_schema.tables 
            WHERE table_type = 'VIEW'
            ORDER BY table_schema, table_name
        """))
        rows = result.fetchall()
        
        print(f"Found {len(rows)} VIEWs:\n")
        for r in rows:
            print(f"  {r[0]:30} | {r[1]:40} | {r[2]}")
        
        if not rows:
            print("No views found. Checking all objects...")
            result = session.execute(text("""
                SELECT table_schema, table_name, table_type 
                FROM workspace.information_schema.tables 
                ORDER BY table_schema, table_name
                LIMIT 50
            """))
            rows = result.fetchall()
            print(f"\nAll objects (first 50):\n")
            for r in rows:
                print(f"  {r[0]:30} | {r[1]:40} | {r[2]}")
            
    except Exception as e:
        print(f"Error: {e}")
    finally:
        session.close()

if __name__ == "__main__":
    find_all_views()
