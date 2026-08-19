import asyncio
import logging
from time import perf_counter

from fastapi import FastAPI, HTTPException

from .config import AgentConfigurationError, get_settings
from .factory import get_guide_workflow, get_user_guide_indexer
from .models import (
    IndexUserGuideRequest,
    IndexUserGuideResponse,
    NaturalLanguageGuideRequest,
    NaturalLanguageGuideResponse,
)
from .workflows import WorkflowError
from .observability import elapsed_ms


app = FastAPI(title="PinTrip Natural Language Guide Service")
logger = logging.getLogger("uvicorn.error.pintrip.api")


@app.get("/health")
def health() -> dict[str, str | bool]:
    settings = get_settings()
    return {
        "status": "UP" if settings.is_ready else "DEGRADED",
        "service": "pintrip-natural-language-guide-service",
        "ready": settings.is_ready,
        "ragEnabled": settings.rag_enabled,
        "ragReady": settings.rag_ready,
    }


@app.post(
    "/agent/natural-language-guide/generate",
    response_model=NaturalLanguageGuideResponse,
)
async def generate_from_natural_language(
    request: NaturalLanguageGuideRequest,
) -> NaturalLanguageGuideResponse:
    started_at = perf_counter()
    logger.info(
        "request.started trip_id=%s destination=%s days=%s",
        request.trip_id,
        request.destination or "unspecified",
        request.days or "unspecified",
    )
    try:
        workflow = get_guide_workflow()
        response = await workflow.aplan(request)
        logger.info(
            "request.completed trip_id=%s duration_ms=%d",
            request.trip_id,
            elapsed_ms(started_at),
        )
        return response
    except AgentConfigurationError as error:
        logger.error(
            "request.failed trip_id=%s duration_ms=%d error_type=%s",
            request.trip_id,
            elapsed_ms(started_at),
            type(error).__name__,
        )
        raise HTTPException(status_code=503, detail=str(error)) from error
    except WorkflowError as error:
        logger.error(
            "request.failed trip_id=%s duration_ms=%d error_type=%s",
            request.trip_id,
            elapsed_ms(started_at),
            type(error).__name__,
        )
        raise HTTPException(status_code=502, detail=str(error)) from error


@app.post(
    "/agent/natural-language-guide/knowledge/guides",
    response_model=IndexUserGuideResponse,
)
async def index_user_guide(
    request: IndexUserGuideRequest,
) -> IndexUserGuideResponse:
    try:
        chunk_count = await asyncio.to_thread(
            get_user_guide_indexer().index,
            request,
        )
        return IndexUserGuideResponse(
            guide_id=request.guide_id,
            revision=request.revision,
            chunk_count=chunk_count,
        )
    except AgentConfigurationError as error:
        raise HTTPException(status_code=503, detail=str(error)) from error
    except Exception as error:
        logger.exception(
            "guide_index.failed guide_id=%s error_type=%s",
            request.guide_id,
            type(error).__name__,
        )
        raise HTTPException(status_code=502, detail="Unable to index guide") from error
