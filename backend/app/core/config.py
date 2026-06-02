from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    database_url: str = "sqlite+aiosqlite:///./fertilizantes.db"
    anthropic_api_key: str = ""
    allowed_origins: List[str] = ["http://localhost:3000"]
    api_secret_token: str = ""

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}


settings = Settings()
