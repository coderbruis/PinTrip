from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, model_validator


def to_camel(value: str) -> str:
    head, *tail = value.split("_")
    return head + "".join(part.title() for part in tail)


class ApiModel(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)


class ImportKnowledgeRequest(ApiModel):
    title: str = Field(min_length=1, max_length=80)
    destination: str = Field(min_length=1, max_length=40)
    content: str = Field(min_length=20, max_length=20_000)
    tags: list[str] = Field(default_factory=list, max_length=20)
    source_type: Literal["operator", "user"] = "operator"
    chunk_size: int = Field(default=500, ge=200, le=1200)
    chunk_overlap: int = Field(default=80, ge=0, le=200)

    @model_validator(mode="after")
    def validate_overlap(self) -> "ImportKnowledgeRequest":
        if self.chunk_overlap >= self.chunk_size:
            raise ValueError("chunkOverlap 必须小于 chunkSize")
        return self


class KnowledgeItem(ApiModel):
    id: str
    title: str
    destination: str
    source: str
    source_type: Literal["operator", "user"]
    chunk_count: int
    status: Literal["published", "indexing", "failed"]
    updated_at: str
    tags: list[str]
    content: str
    chunks: list[str]
    error_message: str | None = None


class KnowledgeList(ApiModel):
    items: list[KnowledgeItem]


class ChunkPreview(ApiModel):
    chunk_count: int
    chunks: list[str]


def format_updated_at(value: datetime) -> str:
    return value.astimezone().strftime("%Y-%m-%d %H:%M")
