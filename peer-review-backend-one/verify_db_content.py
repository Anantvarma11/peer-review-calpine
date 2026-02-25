from app.database import get_db
from app import models

def check_tables():
    # Use the generator to get a session
    gen = get_db()
    db = next(gen)
    
    if db is None:
        print("Failed to get DB session via get_db()")
        return
        
    try:
        print("Checking tables...")
        
        # Check BaseCustomer
        try:
            count = db.query(models.BaseCustomer).count()
            print(f"BaseCustomer count: {count}")
            if count > 0:
                first = db.query(models.BaseCustomer).first()
                print(f"BaseCustomer Sample: {first.__dict__}")
        except Exception as e:
            print(f"BaseCustomer error: {e}")

        # Check Contract
        try:
            count = db.query(models.Contract).count()
            print(f"Contract count: {count}")
            if count > 0:
                first = db.query(models.Contract).first()
                print(f"Contract Sample: {first.__dict__}")
        except Exception as e:
            print(f"Contract error: {e}")
            
    finally:
        db.close()

if __name__ == "__main__":
    check_tables()
