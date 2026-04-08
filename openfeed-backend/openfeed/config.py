from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    backend_api_key: str
    openai_api_key: str
    voyageai_api_key: str
    resend_api_key: str
    resend_from_email: str
    frontend_url: str
    supabase_project_url: str
    supabase_service_role_key: str
    embedding_model: str = "text-embedding-3-small"
    embedding_dimensions: int = 512
    embedding_max_tokens_per_input: int = 8_192
    embedding_max_tokens_per_batch: int = 100_000
    min_similarity_threshold: float = 0.7

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        env_ignore_empty=True,
        extra="ignore",
    )


settings = Settings()  # type: ignore[call-arg]
