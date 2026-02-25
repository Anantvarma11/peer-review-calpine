"""
List tables in workspace catalog
"""
import app.database as db
from sqlalchemy import text

def list_workspace_tables():
    db._init_engine()
    session = db.SessionLocal()
    
    try:
        # Check schemas in workspace catalog
        print("=== Schemas in 'workspace' catalog ===")
        try:
            result = session.execute(text("SHOW SCHEMAS IN workspace"))
            schemas = result.fetchall()
            for s in schemas:
                print(f"  - {s[0]}")
        except Exception as e:
            print(f"  Error: {e}")
        
        # List tables in workspace.default
        print("\n=== Tables in 'workspace.default' ===")
        try:
            result = session.execute(text("SHOW TABLES IN workspace.default"))
            tables = result.fetchall()
            if tables:
                for t in tables:
                    print(f"  - {t}")
            else:
                print("  (No tables found)")
        except Exception as e:
            print(f"  Error: {e}")
            
        # Check samples catalog
        print("\n=== Schemas in 'samples' catalog ===")
        try:
            result = session.execute(text("SHOW SCHEMAS IN samples"))
            schemas = result.fetchall()
            for s in schemas:
                print(f"  - {s[0]}")
        except Exception as e:
            print(f"  Error: {e}")
        
    except Exception as e:
        print(f"General Error: {e}")
    finally:
        session.close()

if __name__ == "__main__":
    list_workspace_tables()
