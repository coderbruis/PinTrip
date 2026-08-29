import logging
from time import perf_counter

from fastapi import FastAPI, HTTPException

from .config import EnhancerConfigurationError, get_settings
from .factory import get_enhancement_service
from .models import EnhanceGuideRequest, EnhanceGuideResponse
from .service import EnhancementError


app = FastAPI(title="PinTrip XHS Service")
logger = logging.getLogger("uvicorn.error.pintrip.xhs-service")


@app.get("/health")
def health() -> dict[str, str | bool]:
    settings = get_settings()
    return {
        "status": "UP" if settings.is_ready else "DEGRADED",
        "service": "pintrip-xhs-service",
        "ready": settings.is_ready,
        "loginType": settings.xhs_login_type.value,
    }


@app.post(
    "/agent/xhs-guide/enhance",
    response_model=EnhanceGuideResponse,
)
async def enhance_guide(request: EnhanceGuideRequest) -> EnhanceGuideResponse:
    started_at = perf_counter()
    logger.info(
        "enhancement.started trip_id=%s locations=%d",
        request.guide.trip_id,
        sum(len(day.items) for day in request.guide.days),
    )
    try:
        response = await get_enhancement_service().enhance(request)
    except EnhancerConfigurationError as error:
        raise HTTPException(status_code=503, detail=str(error)) from error
    except EnhancementError as error:
        logger.warning(
            "enhancement.degraded trip_id=%s reason=%s",
            request.guide.trip_id,
            error,
        )
        raise HTTPException(status_code=502, detail=str(error)) from error
    logger.info(
        "enhancement.completed trip_id=%s notes=%d duration_ms=%d",
        request.guide.trip_id,
        response.source_note_count,
        round((perf_counter() - started_at) * 1000),
    )
    return response
