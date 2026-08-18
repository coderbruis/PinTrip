from functools import lru_cache

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class EnhancerConfigurationError(RuntimeError):
    """Raised when the enhancer cannot be initialized."""


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    crawler_api_url: str = "http://127.0.0.1:8092"
    llm_api_key: str = ""
    openai_api_key: str = ""
    llm_model_id: str = "gpt-4o-mini"
    llm_base_url: str | None = None
    llm_timeout: float = Field(default=90, gt=0, le=300)
    llm_max_retries: int = Field(default=1, ge=0, le=3)
    xhs_max_locations: int = Field(default=8, ge=1, le=30)
    xhs_notes_per_location: int = Field(default=5, ge=1, le=20)
    xhs_max_evidence_notes: int = Field(default=20, ge=1, le=50)
    xhs_crawl_concurrency: int = Field(default=3, ge=1, le=10)
    xhs_crawler_timeout: float = Field(default=180, gt=0, le=600)

    @property
    def resolved_llm_api_key(self) -> str:
        return self.llm_api_key or self.openai_api_key

    @property
    def is_ready(self) -> bool:
        return bool(self.crawler_api_url and self.resolved_llm_api_key)

    def require_credentials(self) -> None:
        if not self.resolved_llm_api_key:
            raise EnhancerConfigurationError(
                "Missing required configuration: LLM_API_KEY or OPENAI_API_KEY"
            )


@lru_cache
def get_settings() -> Settings:
    return Settings()
