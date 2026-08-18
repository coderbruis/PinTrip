from functools import lru_cache
from enum import StrEnum
from pathlib import Path

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


SERVICE_ROOT = Path(__file__).resolve().parent.parent
DEFAULT_SPIDER_XHS_PATH = SERVICE_ROOT / "vendor" / "Spider_XHS"


class CrawlerConfigurationError(RuntimeError):
    """Raised when the configured crawler provider cannot be initialized."""


class XhsLoginType(StrEnum):
    COOKIE = "cookie"
    QRCODE = "qrcode"
    PHONE = "phone"


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=SERVICE_ROOT / ".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

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
    def is_ready(self) -> bool:
        return bool(self.spider_xhs_path.is_dir() and self._login_is_configured())

    def _login_is_configured(self) -> bool:
        if self.xhs_login_type is XhsLoginType.COOKIE:
            return bool(self.xhs_cookies.strip())
        return True

    def require_spider_xhs(self) -> None:
        missing: list[str] = []
        if not self.spider_xhs_path.is_dir():
            raise CrawlerConfigurationError(
                "Spider_XHS source does not exist. Initialize the submodule at: "
                f"{self.spider_xhs_path}"
            )
        if not self._login_is_configured():
            missing.append("XHS_COOKIES")
        if missing:
            raise CrawlerConfigurationError(
                f"Missing required configuration: {', '.join(missing)}"
            )


@lru_cache
def get_settings() -> Settings:
    return Settings()
