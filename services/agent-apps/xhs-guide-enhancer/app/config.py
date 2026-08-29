from functools import lru_cache
from enum import StrEnum
from pathlib import Path

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


SERVICE_ROOT = Path(__file__).resolve().parent.parent
DEFAULT_SPIDER_XHS_PATH = SERVICE_ROOT / "vendor" / "Spider_XHS"


class EnhancerConfigurationError(RuntimeError):
    """Raised when the XHS service cannot be initialized."""


class XhsLoginType(StrEnum):
    COOKIE = "cookie"
    QRCODE = "qrcode"
    PHONE = "phone"


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

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
    spider_xhs_path: Path = DEFAULT_SPIDER_XHS_PATH
    xhs_login_type: XhsLoginType = XhsLoginType.COOKIE
    xhs_cookies: str = ""
    xhs_request_proxies_json: str = ""

    @field_validator("spider_xhs_path", mode="before")
    @classmethod
    def resolve_spider_xhs_path(cls, value: object) -> Path:
        if value is None or not str(value).strip():
            return DEFAULT_SPIDER_XHS_PATH
        path = Path(str(value)).expanduser()
        if not path.is_absolute():
            path = SERVICE_ROOT / path
        return path.resolve()

    @property
    def resolved_llm_api_key(self) -> str:
        return self.llm_api_key or self.openai_api_key

    @property
    def is_ready(self) -> bool:
        return bool(
            self.resolved_llm_api_key
            and self.spider_xhs_path.is_dir()
            and self._login_is_configured()
        )

    def _login_is_configured(self) -> bool:
        if self.xhs_login_type is XhsLoginType.COOKIE:
            return bool(self.xhs_cookies.strip())
        return True

    def require_credentials(self) -> None:
        missing: list[str] = []
        if not self.resolved_llm_api_key:
            missing.append("LLM_API_KEY or OPENAI_API_KEY")
        if not self.spider_xhs_path.is_dir():
            raise EnhancerConfigurationError(
                "Spider_XHS source does not exist. Initialize the submodule at: "
                f"{self.spider_xhs_path}"
            )
        if not self._login_is_configured():
            missing.append("XHS_COOKIES")
        if missing:
            raise EnhancerConfigurationError(
                f"Missing required configuration: {', '.join(missing)}"
            )


@lru_cache
def get_settings() -> Settings:
    return Settings()
