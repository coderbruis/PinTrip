import json
from datetime import date

from ...infrastructure.amap_client import AmapClient


class WeatherAgent:
    """Retrieves normalized AMap forecasts without an intermediate LLM call."""

    def __init__(self, amap_client: AmapClient):
        self._amap_client = amap_client

    def research(self, destination: str, start_date: date | None) -> str:
        weather = self._amap_client.get_weather(destination)
        return json.dumps(
            {
                "source": "amap",
                "destination": destination,
                "start_date": start_date.isoformat() if start_date else "未指定",
                "forecast": weather,
            },
            ensure_ascii=False,
        )
