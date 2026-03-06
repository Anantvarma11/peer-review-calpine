from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from app.core.config import settings

# Build URL only when we have required credentials (avoids crash on missing env)
def _has_db_credentials():
    if settings.USE_MOCK_DATA:
        return False
    if settings.DATABASE_TYPE.lower() == "databricks":
        return bool(settings.DATABRICKS_TOKEN and settings.DATABRICKS_HOST and settings.DATABRICKS_HTTP_PATH)
    return bool(settings.SNOWFLAKE_USER and settings.SNOWFLAKE_ACCOUNT and settings.SNOWFLAKE_DATABASE)

def _make_url():
    if settings.DATABASE_TYPE.lower() == "databricks":
        host = (settings.DATABRICKS_HOST or "").replace("https://", "").rstrip("/")
        return (
            f"databricks://token:{settings.DATABRICKS_TOKEN}@{host}"
            f"?http_path={settings.DATABRICKS_HTTP_PATH}&catalog={settings.DATABRICKS_CATALOG}&schema={settings.DATABRICKS_SCHEMA}"
        )
    return (
        f"snowflake://{settings.SNOWFLAKE_USER}:{settings.SNOWFLAKE_PASSWORD}@"
        f"{settings.SNOWFLAKE_ACCOUNT}/{settings.SNOWFLAKE_DATABASE}/{settings.SNOWFLAKE_SCHEMA}"
        f"?warehouse={settings.SNOWFLAKE_WAREHOUSE}&role={settings.SNOWFLAKE_ROLE}"
    )

engine = None
SessionLocal = None

def _init_engine():
    global engine, SessionLocal
    if engine is not None:
        return engine
    if not _has_db_credentials():
        return None
    try:
        engine = create_engine(
            _make_url(),
            echo=False,
            pool_pre_ping=True,
            pool_recycle=3600,
        )
        SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    except Exception:
        engine = None
        SessionLocal = None
    return engine

Base = declarative_base()

def get_db():
    """
    Dependency that provides a database session.
    If USE_MOCK_DATA is True or DB credentials missing, returns None (mock/fallback).
    """
    if settings.USE_MOCK_DATA or not _has_db_credentials():
        yield None
        return
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
    """Test the database connection. Returns True if successful or mock/no-DB, False otherwise."""
    if settings.USE_MOCK_DATA or not _has_db_credentials():
        return True
    try:
        from sqlalchemy import text
        _init_engine()
        if engine is None:
            return False
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        return True
    except Exception as e:
        print(f"Database connection test failed: {e}")
        return False
