from langchain_core.language_models.chat_models import BaseChatModel

from ..base import build_text_chain
from .prompt import SYSTEM_PROMPT


class ItineraryAgent:
    """Combines verified research into PinTrip itinerary JSON."""

    def __init__(self, llm: BaseChatModel):
        self._chain = build_text_chain(llm, SYSTEM_PROMPT, "{query}")

    def generate(self, query: str) -> str:
        return self._chain.invoke({"query": query})
