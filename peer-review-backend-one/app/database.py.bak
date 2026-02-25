from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from app.core.config import settings

# Determine which database to connect to based on DATABASE_TYPE
if settings.DATABASE_TYPE.lower() == "databricks":
    # Databricks Connection Format: databricks://token:<token>@<host>?http_path=<http_path>&catalog=<catalog>&schema=<schema>
    SQLALCHEMY_DATABASE_URL = (
        f"databricks://token:{settings.DATABRICKS_TOKEN}@{settings.DATABRICKS_HOST.replace('https://', '').rstrip('/')}"
        f"?http_path={settings.DATABRICKS_HTTP_PATH}&catalog={settings.DATABRICKS_CATALOG}&schema={settings.DATABRICKS_SCHEMA}"
    )
else:
    # Snowflake Connection Format: snowflake://<user>:<password>@<account>/<database>/<schema>?warehouse=<warehouse>&role=<role>
    SQLALCHEMY_DATABASE_URL = (
        f"snowflake://{settings.SNOWFLAKE_USER}:{settings.SNOWFLAKE_PASSWORD}@"
        f"{settings.SNOWFLAKE_ACCOUNT}/{settings.SNOWFLAKE_DATABASE}/{settings.SNOWFLAKE_SCHEMA}"
        f"?warehouse={settings.SNOWFLAKE_WAREHOUSE}&role={settings.SNOWFLAKE_ROLE}"
    )

# Create engine (lazy initialization to prevent connection on import if using mocks)
engine = None
SessionLocal = None

def _init_engine():
    global engine, SessionLocal
    if engine is None:
        engine = create_engine(
            SQLALCHEMY_DATABASE_URL, 
            echo=False,
            pool_pre_ping=True,
            pool_recycle=3600
        )
        SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    return engine

Base = declarative_base()

def get_db():
    """
    Dependency that provides a database session.
    If USE_MOCK_DATA is True, returns None (mock mode).
    """
    if settings.USE_MOCK_DATA:
        yield None
    else:
        _init_engine()
        if SessionLocal is None:
            yield None
            return
        db = SessionLocal()
        try:
            yield db
        finally:
            db.close()

def test_connection():
    """Test the database connection. Returns True if successful, False otherwise."""
    if settings.USE_MOCK_DATA:
        return True  # Mock mode always "succeeds"
    try:
        from sqlalchemy import text
        _init_engine()
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        return True
    except Exception as e:
        print(f"Database connection test failed: {e}")
        return False
