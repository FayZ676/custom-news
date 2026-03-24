import os

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    api_key: str = os.getenv("BACKEND_API_KEY", "")
    embedder: str = "local"


settings = Settings()
