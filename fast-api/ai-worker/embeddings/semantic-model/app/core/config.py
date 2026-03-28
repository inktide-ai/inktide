from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    PROJECT_NAME: str = "Chimera Semantic Model"
    API_V1_STR: str = "/api/v1"
    EMBEDDING_MODEL: str = "sentence-transformers/all-MiniLM-L6-v2"
    HF_TOKEN: str | None = None
    HF_ENDPOINT: str | None = None  # Mirror, e.g. https://hf-mirror.com
    OLLAMA_BASE_URL: str | None = None  # Use Ollama instead of HF, e.g. http://localhost:11434
    HOST: str = "0.0.0.0"
    PORT: int = 8000


settings = Settings()
