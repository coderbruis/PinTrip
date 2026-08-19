import logging
from time import perf_counter
from typing import Any

import httpx


logger = logging.getLogger("uvicorn.error.pintrip.amap")


PROVINCE_PREFIXES = tuple(
    sorted(
        {
            "北京市", "天津市", "上海市", "重庆市",
            "河北省", "山西省", "辽宁省", "吉林省", "黑龙江省",
            "江苏省", "浙江省", "安徽省", "福建省", "江西省",
            "山东省", "河南省", "湖北省", "湖南省", "广东省",
            "海南省", "四川省", "贵州省", "云南省", "陕西省",
            "甘肃省", "青海省", "台湾省",
            "内蒙古自治区", "广西壮族自治区", "西藏自治区",
            "宁夏回族自治区", "新疆维吾尔自治区",
            "香港特别行政区", "澳门特别行政区",
            "北京", "天津", "上海", "重庆", "河北", "山西",
            "辽宁", "吉林", "黑龙江", "江苏", "浙江", "安徽",
            "福建", "江西", "山东", "河南", "湖北", "湖南",
            "广东", "海南", "四川", "贵州", "云南", "陕西",
            "甘肃", "青海", "台湾", "内蒙古", "广西", "西藏",
            "宁夏", "新疆", "香港", "澳门",
        },
        key=len,
        reverse=True,
    )
)


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
        for candidate in self._district_query_candidates(city):
            payload = self._get(
                "/config/district",
                {
                    "keywords": candidate,
                    "subdistrict": 0,
                    "extensions": "base",
                },
            )
            districts = payload.get("districts", [])
            if districts and districts[0].get("adcode"):
                if candidate != city:
                    logger.info(
                        "district.fallback original=%s candidate=%s",
                        city,
                        candidate,
                    )
                return districts[0]["adcode"]
        raise AmapClientError(f"cannot resolve city adcode: {city}")

    @staticmethod
    def _district_query_candidates(city: str) -> list[str]:
        normalized = city.strip()
        candidates = [normalized]
        for prefix in PROVINCE_PREFIXES:
            if normalized.startswith(prefix) and len(normalized) > len(prefix):
                candidates.append(normalized[len(prefix):].strip())
                break
        return candidates

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
            if isinstance(error, AmapClientError):
                raise
            raise AmapClientError(
                f"AMap request failed: {type(error).__name__}"
            ) from error
        logger.info(
            "request.completed path=%s duration_ms=%d",
            path,
            round((perf_counter() - started_at) * 1000),
        )
        return payload
