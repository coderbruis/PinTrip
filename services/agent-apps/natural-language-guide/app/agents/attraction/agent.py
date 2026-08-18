import json

from ...infrastructure.amap_client import AmapClient


class AttractionAgent:
    """Retrieves normalized AMap places without an intermediate LLM call."""

    def __init__(self, amap_client: AmapClient):
        self._amap_client = amap_client

    def research(
        self,
        destination: str,
        keywords: list[str],
        days: int,
        prompt: str,
    ) -> str:
        search_keywords = " ".join(["景点", *keywords])
        places = self._amap_client.search_places(
            destination,
            search_keywords,
            limit=min(max(days * 4, 8), 16),
        )
        return json.dumps(
            {
                "source": "amap",
                "destination": destination,
                "days": days,
                "preferences": keywords,
                "original_prompt": prompt,
                "places": places,
                "image_policy": "只能使用 places.photos 中的图片地址",
            },
            ensure_ascii=False,
        )
