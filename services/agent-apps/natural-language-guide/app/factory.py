from functools import lru_cache

from langchain_openai import ChatOpenAI

from .agents.attraction import AttractionAgent
from .agents.intent import IntentAgent
from .agents.itinerary import ItineraryAgent
from .agents.weather import WeatherAgent
from .config import get_settings
from .infrastructure.amap_client import AmapClient
from .infrastructure.local_embedding_client import LocalJavaEmbeddingClient
from .retrieval import NullUserGuideRetriever, UserGuideIndexer, UserGuideRetriever
from .retrieval.postgres import PostgresGuideStore
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
        attraction=AttractionAgent(amap_client),
        weather=WeatherAgent(amap_client),
        itinerary=ItineraryAgent(llm),
    )
    return NaturalLanguageGuideWorkflow(
        agents,
        retriever=get_user_guide_retriever(),
    )


@lru_cache
def get_postgres_guide_store() -> PostgresGuideStore:
    settings = get_settings()
    settings.require_rag_configuration()
    embeddings = LocalJavaEmbeddingClient(
        base_url=settings.embedding_service_url,
        internal_key=settings.pintrip_internal_api_key,
        dimensions=settings.embedding_dimensions,
        timeout=settings.llm_timeout,
    )
    return PostgresGuideStore(
        settings.rag_database_url,
        embeddings,
        settings.embedding_dimensions,
    )


@lru_cache
def get_user_guide_retriever() -> NullUserGuideRetriever | UserGuideRetriever:
    settings = get_settings()
    if not settings.rag_enabled:
        return NullUserGuideRetriever()
    store = get_postgres_guide_store()
    return UserGuideRetriever(
        vector_store=store,
        repository=store,
        limit=settings.rag_retrieval_limit,
    )


@lru_cache
def get_user_guide_indexer() -> UserGuideIndexer:
    return UserGuideIndexer(get_postgres_guide_store())
