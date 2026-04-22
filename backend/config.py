from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql+asyncpg://postgres:password@localhost:5432/arbitrage"
    JWT_SECRET_KEY: str = "super_secret_for_dev_only"
    JWT_ALGORITHM: str = "HS256"
    MIN_CONFIDENCE: float = 0.85
    BINANCE_API_KEY: Optional[str] = None
    BYBIT_API_KEY: Optional[str] = None

    class Config:
        env_file = ".env"

settings = Settings()
