import json

from langchain_core.language_models.chat_models import BaseChatModel

from ...infrastructure.amap_client import AmapClient
from ..base import build_text_chain
from .prompt import HUMAN_PROMPT, SYSTEM_PROMPT


class AttractionAgent:
    """Retrieves real AMap places and asks the LLM to organize candidates."""

    def __init__(self, llm: BaseChatModel, amap_client: AmapClient):
        self._amap_client = amap_client
        self._chain = build_text_chain(llm, SYSTEM_PROMPT, HUMAN_PROMPT)

    def research(
        self,
        destination: str,
        keywords: list[str],
        days: int,
        prompt: str,
    ) -> str:
        search_keywords = " ".join(["景点", *keywords])
        places = self._amap_client.search_places(destination, search_keywords)
        research = self._chain.invoke(
            {
                "destination": destination,
                "days": days,
                "keywords": "、".join(keywords) or "热门景点",
                "original_prompt": prompt,
                "amap_result": json.dumps(places, ensure_ascii=False),
            }
        )
        photo_catalog = [
            {"name": place.get("name"), "photos": place["photos"]}
            for place in places
            if place.get("photos")
        ]
        if not photo_catalog:
            return research
        return (
            f"{research}\n\n可用高德实景图片（只能从以下URL中选择）：\n"
            f"{json.dumps(photo_catalog, ensure_ascii=False)}"
        )
