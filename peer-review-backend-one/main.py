from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.routers import data, ai, auth, recommendation

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json"
)

# Set all CORS enabled origins
# Set all CORS enabled origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(data.router, prefix="/api", tags=["Data"])
app.include_router(ai.router, prefix="/api/ai", tags=["AI"])
app.include_router(recommendation.router, prefix="/api", tags=["Recommendations"])
app.include_router(auth.router, prefix="/api/auth", tags=["Auth"])

@app.on_event("startup")
def startup_event():
    from app.database import test_connection
    import logging

    logging.basicConfig(level=logging.INFO)
    logger = logging.getLogger(__name__)
    
    if settings.USE_MOCK_DATA:
        logger.info("ℹ️ Running in Mock Mode - Database connection skipped.")
        return
    
    logger.info(f"🔗 Connecting to {settings.DATABASE_TYPE.upper()} database...")
    
    if test_connection():
        logger.info(f"✅ SUCCESS: Connected to {settings.DATABASE_TYPE.upper()} database!")
    else:
        logger.error(f"❌ FAILED: Could not connect to {settings.DATABASE_TYPE.upper()} database.") 

@app.get("/")
def root():
    return {"message": "Welcome to Energy Intelligence Platform API"}

@app.get("/health")
def health_check():
    return {"status": "healthy"}
