from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # Redis
    redis_url: str = "redis://localhost:6379"
    redis_stream_in: str = "synapse.llm.ready"
    redis_stream_out: str = "synapse.llm.response"
    redis_consumer_group: str = "llm-workers"
    redis_consumer_name: str = "llm-worker-1"
    redis_read_count: int = 8
    redis_block_ms: int = 2000
    redis_autoclaim_min_idle_ms: int = 30_000
    # Approximate MAXLEN for the output stream (one entry per sentence chunk)
    redis_stream_out_maxlen: int = 50_000

    # Ollama
    ollama_base_url: str = "http://localhost:11434"
    ollama_timeout: int = 600
    ollama_fallback_model: str = "llama3.1:8b"

    # App
    log_level: str = "INFO"


settings = Settings()
