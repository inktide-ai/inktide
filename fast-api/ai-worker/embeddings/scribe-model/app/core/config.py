from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    PROJECT_NAME: str = "Inktide Scribe Model"
    API_V1_STR: str = "/api/v1"

    OLLAMA_BASE_URL: str = "http://localhost:11434"
    OLLAMA_CHAT_MODEL: str = "qwen2.5"
    OLLAMA_EMBED_MODEL: str = "qwen2.5"
    OLLAMA_TIMEOUT: int = 120

    HOST: str = "0.0.0.0"
    PORT: int = 8000


settings = Settings()
