import logging
from time import perf_counter
from typing import Any

import httpx


logger = logging.getLogger("uvicorn.error.pintrip.amap")


class AmapClientError(RuntimeError):
    """Raised when AMap cannot return a successful response."""


class AmapClient:
    BASE_URL = "https://restapi.amap.com/v3"

    def __init__(self, api_key: str, timeout: float = 15):
        self._api_key = api_key
        self._timeout = timeout

    def search_places(
        self, city: str, keywords: str, limit: int = 20
    ) -> list[dict[str, Any]]:
        payload = self._get(
            "/place/text",
            {
                "city": city,
                "citylimit": "true",
                "keywords": keywords,
                "offset": min(max(limit, 1), 25),
                "page": 1,
                "extensions": "all",
            },
        )
        return [
            {
                "name": place.get("name"),
                "address": place.get("address"),
                "location": place.get("location"),
                "type": place.get("type"),
                "photos": self._extract_photo_urls(place),
            }
            for place in payload.get("pois", [])
        ]

    @staticmethod
    def _extract_photo_urls(place: dict[str, Any]) -> list[str]:
        photos = place.get("photos")
        if not isinstance(photos, list):
            return []
        urls = []
        for photo in photos[:3]:
            if not isinstance(photo, dict) or not isinstance(photo.get("url"), str):
                continue
            urls.append(photo["url"].replace("http://", "https://", 1))
        return urls

    def get_weather(self, city: str) -> list[dict[str, Any]]:
        adcode = self._get_city_adcode(city)
        payload = self._get(
            "/weather/weatherInfo",
            {"city": adcode, "extensions": "all"},
        )
        forecasts = payload.get("forecasts", [])
        return forecasts[0].get("casts", []) if forecasts else []

    def _get_city_adcode(self, city: str) -> str:
        payload = self._get(
            "/config/district",
            {"keywords": city, "subdistrict": 0, "extensions": "base"},
        )
        districts = payload.get("districts", [])
        if not districts or not districts[0].get("adcode"):
            raise AmapClientError(f"cannot resolve city adcode: {city}")
        return districts[0]["adcode"]

    def _get(self, path: str, params: dict[str, Any]) -> dict[str, Any]:
        started_at = perf_counter()
        logger.info("request.started path=%s", path)
        try:
            response = httpx.get(
                f"{self.BASE_URL}{path}",
                params={**params, "key": self._api_key},
                timeout=self._timeout,
            )
            response.raise_for_status()
            payload = response.json()
            if payload.get("status") != "1":
                message = payload.get("info") or "unknown AMap error"
                raise AmapClientError(message)
        except Exception as error:
            logger.error(
                "request.failed path=%s duration_ms=%d error_type=%s",
                path,
                round((perf_counter() - started_at) * 1000),
                type(error).__name__,
            )
            raise
        logger.info(
            "request.completed path=%s duration_ms=%d",
            path,
            round((perf_counter() - started_at) * 1000),
        )
        return payload
