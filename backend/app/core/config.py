"""Typed, server-side application settings."""

from functools import lru_cache
from typing import Optional
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Settings read from environment variables or a local .env file."""

    app_name: str = "PorulAxiom Engine"
    app_env: str = "development"
    app_secret_key: str = "porulaxiom-super-secret-key-change-in-production-1234567890"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 60 * 24 * 7  # 7 days

    frontend_origin: str = "http://localhost:3000"

    # Database: Supabase PostgreSQL URL or SQLite fallback
    database_url: str = "sqlite:///./porulaxiom.db"
    supabase_url: Optional[str] = None
    supabase_service_role_key: Optional[str] = None

    # Market Data Provider
    market_data_provider: str = "simulation"  # 'upstox' or 'simulation'
    upstox_client_id: Optional[str] = None
    upstox_client_secret: Optional[str] = None
    upstox_redirect_uri: Optional[str] = None

    # Initial paper balance
    initial_paper_balance: float = 1_000_000.0

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )


@lru_cache
def get_settings() -> Settings:
    """Return cached validated settings for the process lifetime."""
    return Settings()
