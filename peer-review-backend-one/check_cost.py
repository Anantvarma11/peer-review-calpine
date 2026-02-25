from app.database import SessionLocal
from app import models
from sqlalchemy import text

def check_cost_data():
    db = SessionLocal()
    try:
        print("Checking MonthlyUsage Cost Data...")
        
        # Get a few sample records
        usage = db.query(models.MonthlyUsage).limit(5).all()
        for u in usage:
            print(f"Customer: {u.CUSTOMER_ID}, Month: {u.BILLING_MONTH}, Cost: {u.MONTHLY_COST}, KWH: {u.MONTHLY_KWH}")
            
        # Check specific customer from screenshot context if possible, otherwise just general
        # The user was seeing 107075. Let's see if we find anything close.
        high_val = db.query(models.MonthlyUsage).filter(models.MonthlyUsage.MONTHLY_COST > 1000).first()
        if high_val:
             print(f"\nFound High Value Record: Customer {high_val.CUSTOMER_ID}, Cost: {high_val.MONTHLY_COST}")

    except Exception as e:
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    check_cost_data()
