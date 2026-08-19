from dataclasses import dataclass
from typing import Any


@dataclass(frozen=True)
class GuideSearchQuery:
    text: str
    user_id: str
    destination: str
    limit: int


@dataclass(frozen=True)
class GuideChunkMatch:
    chunk_id: str
    score: float


@dataclass(frozen=True)
class GuideChunk:
    chunk_id: str
    guide_id: str
    chunk_type: str
    content: str
    destination: str | None = None
    place: str | None = None


@dataclass(frozen=True)
class IndexedGuide:
    user_id: str
    guide_id: str
    revision: int
    destination: str
    payload: dict[str, Any]
    chunks: list[GuideChunk]
