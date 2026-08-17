import logging
from time import perf_counter

from fastapi import FastAPI, HTTPException
from fastapi.concurrency import run_in_threadpool

from .config import AgentConfigurationError, get_settings
from .factory import get_guide_workflow
from .models import NaturalLanguageGuideRequest, NaturalLanguageGuideResponse
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
        response = await run_in_threadpool(workflow.plan, request)
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
