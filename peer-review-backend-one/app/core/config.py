import os
from pathlib import Path
from typing import List, Union
from pydantic import AnyHttpUrl, validator
from pydantic_settings import BaseSettings, SettingsConfigDict

# Optional env file (e.g. missing on Vercel where env vars come from dashboard)
_env_file = Path(__file__).resolve().parent.parent.parent / "app.env"
_env_file = str(_env_file) if _env_file.exists() else None

class Settings(BaseSettings):
    PROJECT_NAME: str = "Energy Intelligence Dashboard"
    API_V1_STR: str = "/api"
    SECRET_KEY: str = "change-me-in-production"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 8 
    
    # Snowflake
    SNOWFLAKE_USER: str = ""
    SNOWFLAKE_PASSWORD: str = ""
    SNOWFLAKE_ACCOUNT: str = ""
    SNOWFLAKE_DATABASE: str = ""
    SNOWFLAKE_SCHEMA: str = "PUBLIC"
    SNOWFLAKE_WAREHOUSE: str = ""
    SNOWFLAKE_ROLE: str = ""

    # Databricks
    DATABRICKS_HOST: str = ""
    DATABRICKS_HTTP_PATH: str = ""
    DATABRICKS_TOKEN: str = ""
    DATABRICKS_CATALOG: str = ""
    DATABRICKS_SCHEMA: str = "default"
    DATABRICKS_AI_ENDPOINT: str = ""
    
    # Database Type: "snowflake" or "databricks"
    DATABASE_TYPE: str = "databricks"  # Default to Databricks for company deployment

    # CORS
    BACKEND_CORS_ORIGINS: List[AnyHttpUrl] = []

    @validator("BACKEND_CORS_ORIGINS", pre=True)
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> List[str]:
        if isinstance(v, str) and not v.startswith("["):
            return [i.strip() for i in v.split(",")]
        elif isinstance(v, (list, str)):
            return v
        raise ValueError(v)

    # AI
    OPENAI_API_KEY: str = ""
    AZURE_OPENAI_ENDPOINT: str = ""
    AZURE_OPENAI_API_VERSION: str = "2024-12-01-preview"
    AZURE_OPENAI_MODEL: str = "gpt-4"
    # ELEVENLABS_API_KEY: str = "" # Deprecated
    AZURE_SPEECH_KEY: str = ""
    AZURE_SPEECH_REGION: str = "eastus" # Default, user must update
    GEMINI_API_KEY: str = ""
    USE_MOCK_DATA: bool = False  # Only use real Databricks data

    # Deployment
    BACKEND_CONNECTING_URL: str = ""
    SSL_CERT_FILE: str = ""

    model_config = SettingsConfigDict(case_sensitive=True, env_file=_env_file, extra="ignore")

settings = Settings()

# Apply SSL fix if provided
if settings.SSL_CERT_FILE:
    os.environ["SSL_CERT_FILE"] = settings.SSL_CERT_FILE
