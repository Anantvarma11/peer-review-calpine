from app.database import _init_engine, SessionLocal
from app import models
from app.core.config import settings

print(f"DEBUG: Using settings - DB Type: {settings.DATABASE_TYPE}, Mock: {settings.USE_MOCK_DATA}")

# Force Mock Data to False for this script to test connection
settings.USE_MOCK_DATA = False
_init_engine()

# Re-import SessionLocal if it was updated by _init_engine (it's a global rewrite in that module)
from app.database import SessionLocal 

if SessionLocal is None:
    print("ERROR: SessionLocal is None after init!")
    exit(1)

db = SessionLocal()
try:
    print("--- Debugging DB Content ---")
    
    # Check Customers
    print("Querying Customers...")
    customers = db.query(models.BaseCustomerContract).limit(5).all()
    print(f"Total Customers (limit 5): {len(customers)}")
    for c in customers:
        print(f"  Customer: {c.CUSTOMER_ID} - {c.CUSTOMER_NAME}")

    # Check Monthly Usage
    print("Querying Monthly Usage...")
    usage = db.query(models.MonthlyUsage).limit(5).all()
    print(f"Total Monthly Usage Records (limit 5): {len(usage)}")
    for u in usage:
        print(f"  Usage: {u.CUSTOMER_ID} - {u.BILLING_MONTH} - {u.MONTHLY_KWH}")

    # Check Distinct IDs
    distinct_ids = db.query(models.MonthlyUsage.CUSTOMER_ID).distinct().limit(10).all()
    print(f"Distinct IDs in Usage: {[i[0] for i in distinct_ids]}")

except Exception as e:
    print(f"DB Error: {e}")
    import traceback
    traceback.print_exc()
finally:
    db.close()
