from functools import lru_cache

from .config import get_settings
from .providers import SpiderXhsProvider
from .service import CrawlService


@lru_cache
def get_crawl_service() -> CrawlService:
    return CrawlService(SpiderXhsProvider(get_settings()))
