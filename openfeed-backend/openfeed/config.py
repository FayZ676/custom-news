import os

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    api_key: str = os.getenv("BACKEND_API_KEY", "")

    embedding_model: str = "text-embedding-3-small"
    embedding_dimensions: int = 512
    embedding_max_tokens_per_input: int = 8_192
    embedding_max_tokens_per_batch: int = 100_000

    summarization_model: str = "gpt-4o-mini"
    summarization_max_tokens: int = 200
    summarization_max_input_chars: int = 15_000


settings = Settings()
