import logging
from functools import wraps
from time import perf_counter
from typing import Callable, TypeVar


logger = logging.getLogger("uvicorn.error.pintrip.workflow")

ResultType = TypeVar("ResultType")


def log_workflow_node(name: str):
    """Log LangGraph node progress without exposing user prompts or credentials."""

    def decorator(function: Callable[..., ResultType]) -> Callable[..., ResultType]:
        @wraps(function)
        def wrapper(self, state, *args, **kwargs):
            request = state.get("request")
            trip_id = getattr(request, "trip_id", "unknown")
            started_at = perf_counter()
            logger.info("node.started name=%s trip_id=%s", name, trip_id)
            try:
                result = function(self, state, *args, **kwargs)
            except Exception as error:
                logger.error(
                    "node.failed name=%s trip_id=%s duration_ms=%d error_type=%s",
                    name,
                    trip_id,
                    _elapsed_ms(started_at),
                    type(error).__name__,
                )
                raise
            logger.info(
                "node.completed name=%s trip_id=%s duration_ms=%d",
                name,
                trip_id,
                _elapsed_ms(started_at),
            )
            return result

        return wrapper

    return decorator


def elapsed_ms(started_at: float) -> int:
    return _elapsed_ms(started_at)


def _elapsed_ms(started_at: float) -> int:
    return round((perf_counter() - started_at) * 1000)
