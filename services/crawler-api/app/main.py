import logging
from time import perf_counter

from fastapi import FastAPI, HTTPException
from fastapi.concurrency import run_in_threadpool

from .config import CrawlerConfigurationError, get_settings
from .factory import get_crawl_service
from .models import CrawlSearchRequest, CrawlSearchResponse
from .providers import SourceError


app = FastAPI(title="PinTrip Crawler API")
logger = logging.getLogger("uvicorn.error.pintrip.crawler")


def _search(request: CrawlSearchRequest) -> CrawlSearchResponse:
    """Initialize the source and execute blocking crawler work off the event loop."""
    return get_crawl_service().search(request)


@app.get("/health")
def health() -> dict[str, str | bool]:
    settings = get_settings()
    ready = settings.is_ready
    return {
        "status": "UP" if ready else "DEGRADED",
        "service": "pintrip-crawler-api",
        "ready": ready,
        "login_type": settings.xhs_login_type.value,
    }


@app.post("/crawl/xhs/search", response_model=CrawlSearchResponse)
async def search_xhs_notes(request: CrawlSearchRequest) -> CrawlSearchResponse:
    started_at = perf_counter()
    logger.info(
        "crawl.started keyword=%s limit=%d include_comments=%s",
        request.keyword,
        request.limit,
        request.include_comments,
    )
    try:
        result = await run_in_threadpool(_search, request)
        logger.info(
            "crawl.completed keyword=%s returned=%d duration_ms=%d",
            request.keyword,
            result.returned_count,
            round((perf_counter() - started_at) * 1000),
        )
        return result
    except CrawlerConfigurationError as error:
        raise HTTPException(status_code=503, detail=str(error)) from error
    except SourceError as error:
        raise HTTPException(status_code=502, detail=str(error)) from error
