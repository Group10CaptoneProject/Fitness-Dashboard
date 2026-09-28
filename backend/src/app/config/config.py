from pathlib import Path 
from typing import Optional
from pydantic_settings import BaseSettings, SettingsConfigDict 

# Point to src/.env relative to this config file
ENV_PATH = Path(__file__).resolve().parent.parent.parent / ".env"

class Settings(BaseSettings):
    database_url: str
    jwt_secret_key: str = "dev_jwt_secret"
    resend_api_key: Optional[str] = None
    model_config = SettingsConfigDict(env_file = ".env", extra="ignore")

settings = Settings()