import app.database
from sqlalchemy import text

def inspect_table():
    app.database._init_engine()
    db = app.database.SessionLocal()
    try:
        # Try to select the first row to see columns
        result = db.execute(text("SELECT * FROM BASE_CUSTOMER_CONTRACT_VW LIMIT 1"))
        keys = result.keys()
        with open("schema_info.txt", "w") as f:
            f.write(f"Columns in BASE_CUSTOMER_CONTRACT_VW: {list(keys)}")
        print("Done writing schema_info.txt")
        
    except Exception as e:
        with open("schema_info.txt", "w") as f:
            f.write(f"Error: {e}")
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    inspect_table()
