from pathlib import Path 
from typing import Optional
from pydantic_settings import BaseSettings, SettingsConfigDict 

BASE_DIR = Path(__file__).resolve().parents[3]

class Settings(BaseSettings):
    database_url: str
    EXERCISEDB_API_KEY: str
    jwt_secret_key: str = "dev_jwt_secret"
    resend_api_key: Optional[str] = None
    
    model_config = SettingsConfigDict(env_file= BASE_DIR/ ".env", extra="ignore")  # <--- Update this to ENV_PATH

settings = Settings()