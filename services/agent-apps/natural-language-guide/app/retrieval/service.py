from ..models import ResolvedTripIntent, UserGuideEvidence
from .models import GuideSearchQuery
from .ports import GuideRepository, GuideVectorStore


class NullUserGuideRetriever:
    """Keeps generation available until a vector-store adapter is configured."""

    def retrieve(
        self,
        *,
        user_id: str | None,
        intent: ResolvedTripIntent,
        prompt: str,
    ) -> list[UserGuideEvidence]:
        return []


class UserGuideRetriever:
    def __init__(
        self,
        vector_store: GuideVectorStore,
        repository: GuideRepository,
        limit: int = 8,
    ):
        if limit < 1:
            raise ValueError("limit must be at least 1")
        self._vector_store = vector_store
        self._repository = repository
        self._limit = limit

    def retrieve(
        self,
        *,
        user_id: str | None,
        intent: ResolvedTripIntent,
        prompt: str,
    ) -> list[UserGuideEvidence]:
        if not user_id:
            return []

        matches = self._vector_store.search(
            GuideSearchQuery(
                text=self._build_query_text(prompt, intent),
                user_id=user_id,
                destination=intent.destination,
                limit=self._limit,
            )
        )
        if not matches:
            return []

        score_by_chunk_id = {match.chunk_id: match.score for match in matches}
        chunks = self._repository.find_accessible_chunks(
            user_id, [match.chunk_id for match in matches]
        )
        chunks.sort(
            key=lambda chunk: score_by_chunk_id.get(chunk.chunk_id, float("-inf")),
            reverse=True,
        )
        return [
            UserGuideEvidence(
                chunk_id=chunk.chunk_id,
                guide_id=chunk.guide_id,
                chunk_type=chunk.chunk_type,
                content=chunk.content,
                destination=chunk.destination,
                place=chunk.place,
                score=score_by_chunk_id.get(chunk.chunk_id),
            )
            for chunk in chunks[: self._limit]
        ]

    @staticmethod
    def _build_query_text(prompt: str, intent: ResolvedTripIntent) -> str:
        context = [
            intent.destination,
            f"{intent.days}天",
            intent.transportation,
            intent.accommodation,
            *intent.preferences,
            *intent.requirements,
        ]
        return " ".join([prompt, *filter(None, context)])
