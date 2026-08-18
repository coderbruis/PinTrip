from enum import IntEnum

from pydantic import BaseModel, Field, field_validator


class SortBy(IntEnum):
    GENERAL = 0
    LATEST = 1
    MOST_LIKED = 2
    MOST_COMMENTED = 3
    MOST_COLLECTED = 4


class NoteType(IntEnum):
    ALL = 0
    VIDEO = 1
    IMAGE_TEXT = 2


class CrawlSearchRequest(BaseModel):
    keyword: str = Field(min_length=1, max_length=100)
    limit: int = Field(default=20, ge=1, le=100)
    sort_by: SortBy = SortBy.GENERAL
    note_type: NoteType = NoteType.ALL
    include_comments: bool = True

    @field_validator("keyword")
    @classmethod
    def normalize_keyword(cls, value: str) -> str:
        normalized = value.strip()
        if not normalized:
            raise ValueError("keyword must not be blank")
        return normalized


class Author(BaseModel):
    user_id: str = ""
    nickname: str = ""


class CrawledComment(BaseModel):
    comment_id: str
    note_id: str
    parent_comment_id: str | None = None
    content: str = ""
    author: Author = Field(default_factory=Author)
    like_count: int = 0
    created_at: str | None = None
    ip_location: str | None = None


class CrawledNote(BaseModel):
    note_id: str
    note_url: str
    title: str = ""
    content: str = ""
    tags: list[str] = Field(default_factory=list)
    author: Author = Field(default_factory=Author)
    liked_count: int = 0
    collected_count: int = 0
    comment_count: int = 0
    share_count: int = 0
    published_at: str | None = None
    ip_location: str | None = None
    image_urls: list[str] = Field(default_factory=list)
    video_url: str | None = None
    comments: list[CrawledComment] = Field(default_factory=list)


class CrawlSearchResponse(BaseModel):
    keyword: str
    requested_count: int
    returned_count: int
    notes: list[CrawledNote]
