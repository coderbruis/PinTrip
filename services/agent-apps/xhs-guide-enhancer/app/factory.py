from functools import lru_cache

from langchain_openai import ChatOpenAI

from .agents import GuideMergerAgent
from .config import EnhancerConfigurationError, get_settings
from .infrastructure import CrawlerApiClient
from .service import XhsGuideEnhancementService


@lru_cache
def get_enhancement_service() -> XhsGuideEnhancementService:
    settings = get_settings()
    settings.require_credentials()
    try:
        llm = ChatOpenAI(
            model=settings.llm_model_id,
            api_key=settings.resolved_llm_api_key,
            base_url=settings.llm_base_url,
            timeout=settings.llm_timeout,
            max_retries=settings.llm_max_retries,
            temperature=0,
        )
    except Exception as error:
        raise EnhancerConfigurationError(
            f"Unable to initialize enhancement model client: {error}"
        ) from error
    return XhsGuideEnhancementService(
        crawler=CrawlerApiClient(
            settings.crawler_api_url,
            settings.xhs_crawler_timeout,
        ),
        merger=GuideMergerAgent(llm),
        max_locations=settings.xhs_max_locations,
        notes_per_location=settings.xhs_notes_per_location,
        max_evidence_notes=settings.xhs_max_evidence_notes,
        concurrency=settings.xhs_crawl_concurrency,
    )
