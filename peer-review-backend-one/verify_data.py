from app.database import SessionLocal
from app import models
from sqlalchemy import text

def check_data():
    db = SessionLocal()
    try:
        print("Checking Database Data...")
        
        # Check Customers
        customer_count = db.query(models.BaseCustomerContract).count()
        print(f"BaseCustomerContract Count: {customer_count}")
        
        if customer_count > 0:
            first_customer = db.query(models.BaseCustomerContract).first()
            print(f"First Customer ID: {first_customer.CUSTOMER_ID}")

        # Check Monthly Usage
        monthly_count = db.query(models.MonthlyUsage).count()
        print(f"MonthlyUsage Count: {monthly_count}")
        
        # Find a customer with Monthly Usage
        active_customer = db.query(models.MonthlyUsage.CUSTOMER_ID).first()
        if active_customer:
             print(f"Active Customer ID with Monthly Data: {active_customer.CUSTOMER_ID}")
        else:
             print("No customers have monthly usage data!")

        # Check Daily Usage
        daily_count = db.query(models.DailyUsage).count()
        print(f"DailyUsage Count: {daily_count}")
        
        active_daily = db.query(models.DailyUsage.CUSTOMER_ID).first()
        if active_daily:
            print(f"Active Customer ID with Daily Data: {active_daily.CUSTOMER_ID}")

    except Exception as e:
        print(f"Error connecting or querying: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    check_data()
