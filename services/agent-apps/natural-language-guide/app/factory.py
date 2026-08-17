from functools import lru_cache

from langchain_openai import ChatOpenAI

from .agents.attraction import AttractionAgent
from .agents.intent import IntentAgent
from .agents.itinerary import ItineraryAgent
from .agents.weather import WeatherAgent
from .config import get_settings
from .infrastructure.amap_client import AmapClient
from .workflows import NaturalLanguageGuideWorkflow, WorkflowAgents


@lru_cache
def get_guide_workflow() -> NaturalLanguageGuideWorkflow:
    settings = get_settings()
    settings.require_agent_credentials()

    llm = ChatOpenAI(
        model=settings.llm_model_id,
        api_key=settings.resolved_llm_api_key,
        base_url=settings.llm_base_url,
        timeout=settings.llm_timeout,
        max_retries=settings.llm_max_retries,
        temperature=0,
    )
    amap_client = AmapClient(settings.amap_maps_api_key)

    agents = WorkflowAgents(
        intent=IntentAgent(llm),
        attraction=AttractionAgent(llm, amap_client),
        weather=WeatherAgent(llm, amap_client),
        itinerary=ItineraryAgent(llm),
    )
    return NaturalLanguageGuideWorkflow(agents)
