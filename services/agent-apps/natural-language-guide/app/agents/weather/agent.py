import json
from datetime import date

from langchain_core.language_models.chat_models import BaseChatModel

from ...infrastructure.amap_client import AmapClient
from ..base import build_text_chain
from .prompt import HUMAN_PROMPT, SYSTEM_PROMPT


class WeatherAgent:
    """Retrieves AMap forecasts and summarizes travel impact."""

    def __init__(self, llm: BaseChatModel, amap_client: AmapClient):
        self._amap_client = amap_client
        self._chain = build_text_chain(llm, SYSTEM_PROMPT, HUMAN_PROMPT)

    def research(self, destination: str, start_date: date | None) -> str:
        weather = self._amap_client.get_weather(destination)
        return self._chain.invoke(
            {
                "destination": destination,
                "start_date": start_date.isoformat() if start_date else "未指定",
                "amap_result": json.dumps(weather, ensure_ascii=False),
            }
        )
