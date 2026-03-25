import os

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    api_key: str = os.getenv("BACKEND_API_KEY", "")

    embedding_model: str = "text-embedding-3-small"
    embedding_dimensions: int = 512
    embedding_max_tokens_per_input: int = 8_192
    embedding_max_tokens_per_batch: int = 100_000


settings = Settings()
