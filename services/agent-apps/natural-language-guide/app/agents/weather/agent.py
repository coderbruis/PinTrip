import json
import logging
from datetime import date

from ...infrastructure.amap_client import AmapClient, AmapClientError


logger = logging.getLogger("uvicorn.error.pintrip.weather")


class WeatherAgent:
    """Retrieves normalized AMap forecasts without an intermediate LLM call."""

    def __init__(self, amap_client: AmapClient):
        self._amap_client = amap_client

    def research(self, destination: str, start_date: date | None) -> str:
        try:
            weather = self._amap_client.get_weather(destination)
        except AmapClientError as error:
            logger.warning(
                "weather.unavailable destination=%s reason=%s",
                destination,
                error,
            )
            return self._unavailable_result(destination, start_date)
        if not weather:
            logger.warning(
                "weather.unavailable destination=%s reason=empty_forecast",
                destination,
            )
            return self._unavailable_result(destination, start_date)
        return self._serialize_result(
            destination,
            start_date,
            forecast=weather,
            available=True,
        )

    @staticmethod
    def _serialize_result(
        destination: str,
        start_date: date | None,
        forecast: list[dict],
        available: bool,
    ) -> str:
        return json.dumps(
            {
                "source": "amap",
                "available": available,
                "destination": destination,
                "start_date": start_date.isoformat() if start_date else "未指定",
                "forecast": forecast,
            },
            ensure_ascii=False,
        )

    @classmethod
    def _unavailable_result(
        cls,
        destination: str,
        start_date: date | None,
    ) -> str:
        return cls._serialize_result(
            destination,
            start_date,
            forecast=[],
            available=False,
        )
