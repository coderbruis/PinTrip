from dataclasses import dataclass
from datetime import date
from typing import Protocol


class IntentAgentRunner(Protocol):
    def resolve(self, query: str) -> str: ...


class AttractionAgentRunner(Protocol):
    def research(
        self, destination: str, keywords: list[str], days: int, prompt: str
    ) -> str: ...


class WeatherAgentRunner(Protocol):
    def research(self, destination: str, start_date: date | None) -> str: ...


class ItineraryAgentRunner(Protocol):
    def generate(self, query: str) -> str: ...


@dataclass(frozen=True)
class WorkflowAgents:
    intent: IntentAgentRunner
    attraction: AttractionAgentRunner
    weather: WeatherAgentRunner
    itinerary: ItineraryAgentRunner
