"""
Test connection with corrected settings
"""
import os
os.environ["DATABRICKS_CATALOG"] = "workspace"
os.environ["DATABRICKS_SCHEMA"] = "askcal-analytics-dev"

import app.database as db
from sqlalchemy import text

def test_connection():
    db._engine = None  # Force re-init
    db._init_engine()
    session = db.SessionLocal()
    
    try:
        print("=== Testing corrected connection ===\n")
        
        # Test 1: List customers
        print("1. Querying customers...")
        result = session.execute(text("SELECT cust_id, First_Name, Last_Name, Account_Number FROM `workspace`.`askcal-analytics-dev`.`customer` LIMIT 5"))
        rows = result.fetchall()
        print(f"   Found {len(rows)} customers:")
        for r in rows:
            print(f"   - {r[0]}: {r[1]} {r[2]} (Acct: {r[3]})")
        
        # Test 2: Check hourly usage
        print("\n2. Querying hourly usage...")
        result = session.execute(text("SELECT COUNT(*) as cnt FROM `workspace`.`askcal-analytics-dev`.`hourly_24_k`"))
        count = result.fetchone()[0]
        print(f"   Total hourly records: {count}")
        
        # Test 3: Sample hourly data
        print("\n3. Sample hourly data...")
        result = session.execute(text("SELECT ESIID, IntervalDate, IntervalHour, Value FROM `workspace`.`askcal-analytics-dev`.`hourly_24_k` LIMIT 3"))
        for r in result.fetchall():
            print(f"   ESIID: {r[0]}, Date: {r[1]}, Hour: {r[2]}, kWh: {r[3]}")
            
        print("\n[SUCCESS] Connection working!")
        
    except Exception as e:
        print(f"\n[ERROR] {e}")
    finally:
        session.close()

if __name__ == "__main__":
    test_connection()
