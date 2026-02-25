from app.database import SessionLocal
from app import models
from sqlalchemy import text

def check_peer_data():
    db = SessionLocal()
    try:
        print("Checking PeerUsage Data...")
        
        count = db.query(models.PeerUsage).count()
        print(f"PeerUsage Count: {count}")
        
        if count > 0:
            first = db.query(models.PeerUsage).first()
            print(f"Sample Peer Data: Customer {first.CUSTOMER_ID}, Avg {first.PEER_AVG_USAGE_KWH}")
        else:
            print("PeerUsage table is empty.")

    except Exception as e:
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    check_peer_data()
