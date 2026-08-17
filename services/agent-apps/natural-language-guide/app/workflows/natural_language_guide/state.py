from typing import TypedDict

from ...models import (
    GeneratedItinerary,
    NaturalLanguageGuideRequest,
    ResolvedTripIntent,
)


class GuideWorkflowState(TypedDict, total=False):
    """Shared state passed between LangGraph nodes."""

    request: NaturalLanguageGuideRequest
    intent: ResolvedTripIntent
    attraction_research: str
    weather_research: str
    itinerary_query: str
    itinerary_response: str
    itinerary: GeneratedItinerary
    generation_attempts: int
    generation_error: str | None
