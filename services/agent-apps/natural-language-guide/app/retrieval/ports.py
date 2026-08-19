from typing import Protocol

from ..models import ResolvedTripIntent, UserGuideEvidence
from .models import GuideChunk, GuideChunkMatch, GuideSearchQuery, IndexedGuide


class GuideVectorStore(Protocol):
    """Searches an index that applies the user scope before returning matches."""

    def search(self, query: GuideSearchQuery) -> list[GuideChunkMatch]: ...


class GuideRepository(Protocol):
    """Loads canonical chunks while enforcing ownership and visibility."""

    def find_accessible_chunks(
        self, user_id: str, chunk_ids: list[str]
    ) -> list[GuideChunk]: ...


class GuideIndexStore(Protocol):
    def replace_guide(self, guide: IndexedGuide) -> int: ...


class EmbeddingProvider(Protocol):
    def embed_documents(self, texts: list[str]) -> list[list[float]]: ...

    def embed_query(self, text: str) -> list[float]: ...


class UserGuideRetrieverRunner(Protocol):
    def retrieve(
        self,
        *,
        user_id: str | None,
        intent: ResolvedTripIntent,
        prompt: str,
    ) -> list[UserGuideEvidence]: ...
