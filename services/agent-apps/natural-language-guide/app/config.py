from functools import lru_cache

from pydantic import AliasChoices, Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class AgentConfigurationError(RuntimeError):
    """Raised when required Agent credentials are missing."""


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    amap_maps_api_key: str = Field(
        default="",
        validation_alias=AliasChoices("AMAP_MAPS_API_KEY", "AMAP_API_KEY"),
    )
    llm_api_key: str = ""
    openai_api_key: str = ""
    llm_model_id: str = "gpt-4o-mini"
    llm_base_url: str | None = None
    llm_timeout: float = Field(default=60, gt=0)
    llm_max_retries: int = Field(default=1, ge=0, le=5)
    rag_database_url: str = ""
    rag_retrieval_limit: int = Field(default=8, ge=1, le=30)
    embedding_service_url: str = "http://127.0.0.1:8081"
    pintrip_internal_api_key: str = "pintrip-local-internal-key"
    embedding_dimensions: int = Field(default=512, ge=1, le=2000)

    @property
    def resolved_llm_api_key(self) -> str:
        return self.llm_api_key or self.openai_api_key

    @property
    def has_llm_credentials(self) -> bool:
        return bool(self.llm_api_key or self.openai_api_key)

    @property
    def rag_enabled(self) -> bool:
        return bool(self.rag_database_url)

    @property
    def rag_ready(self) -> bool:
        return self.rag_enabled and bool(
            self.embedding_service_url and self.pintrip_internal_api_key
        )

    @property
    def is_ready(self) -> bool:
        return bool(self.amap_maps_api_key and self.has_llm_credentials)

    def require_agent_credentials(self) -> None:
        missing = []
        if not self.amap_maps_api_key:
            missing.append("AMAP_MAPS_API_KEY")
        if not self.has_llm_credentials:
            missing.append("LLM_API_KEY or OPENAI_API_KEY")
        if missing:
            raise AgentConfigurationError(
                f"Missing required configuration: {', '.join(missing)}"
            )

    def require_rag_configuration(self) -> None:
        missing = []
        if not self.rag_database_url:
            missing.append("RAG_DATABASE_URL")
        if not self.embedding_service_url:
            missing.append("EMBEDDING_SERVICE_URL")
        if not self.pintrip_internal_api_key:
            missing.append("PINTRIP_INTERNAL_API_KEY")
        if missing:
            raise AgentConfigurationError(
                f"Missing required RAG configuration: {', '.join(missing)}"
            )


@lru_cache
def get_settings() -> Settings:
    return Settings()
