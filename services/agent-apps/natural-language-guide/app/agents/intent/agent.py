from langchain_core.language_models.chat_models import BaseChatModel

from ..base import build_text_chain
from .prompt import SYSTEM_PROMPT


class IntentAgent:
    """Turns a free-form request into structured trip intent JSON."""

    def __init__(self, llm: BaseChatModel):
        self._chain = build_text_chain(llm, SYSTEM_PROMPT, "{query}")

    def resolve(self, query: str) -> str:
        return self._chain.invoke({"query": query})
