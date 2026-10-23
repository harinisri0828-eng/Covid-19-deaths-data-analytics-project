from pathlib import Path
from typing import List, Optional
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field

BASE_DIR = Path(__file__).resolve().parent.parent

class Settings(BaseSettings):
    PROJECT_NAME: str = "COVID-19 Analytics and Prediction System"
    API_V1_STR: str = "/api"
    ENVIRONMENT: str = "development"
    
    # Server Bindings
    HOST: str = "127.0.0.1"
    PORT: int = 8001
    
    # Database Settings
    DATABASE_URL: str = Field(
        default="sqlite:///./covid_analytics.db",
        description="Database URL supporting PostgreSQL (postgresql+psycopg://) and SQLite fallback"
    )
    
    # CORS Settings
    CORS_ORIGINS: str = "http://localhost:5173,http://127.0.0.1:5173,http://localhost:5174,http://127.0.0.1:5174,http://localhost:3000"
    CORS_ORIGIN_REGEX: Optional[str] = r"https://.*\.onrender\.com|https://.*\.vercel\.app"
    
    # Data Paths
    DATA_DIR: Path = BASE_DIR / "data"
    SAVED_MODELS_DIR: Path = BASE_DIR / "saved_models"
    DATA_SOURCE_URL: str = "https://covid.ourworldindata.org/data/owid-covid-data.csv"
    
    @property
    def cors_origins_list(self) -> List[str]:
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",") if origin.strip()]
        
    @property
    def normalized_database_url(self) -> str:
        url = self.DATABASE_URL
        if url.startswith("postgres://"):
            url = url.replace("postgres://", "postgresql+psycopg://", 1)
        elif url.startswith("postgresql://") and not url.startswith("postgresql+psycopg://"):
            url = url.replace("postgresql://", "postgresql+psycopg://", 1)
        return url

    model_config = SettingsConfigDict(
        env_file=str(BASE_DIR / ".env"),
        env_file_encoding="utf-8",
        extra="ignore"
    )

settings = Settings()
