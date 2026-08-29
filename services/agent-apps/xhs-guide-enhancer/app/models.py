from enum import IntEnum

from pydantic import BaseModel, ConfigDict, Field


class GuideItem(BaseModel):
    time: str
    place: str
    activity: str
    transport: str | None = None
    tips: list[str] = Field(default_factory=list)


class GuideDay(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    day: int = Field(ge=1)
    title: str
    image_url: str | None = Field(default=None, alias="imageUrl")
    items: list[GuideItem] = Field(min_length=1)


class GeneratedGuide(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    trip_id: str
    original_prompt: str | None = Field(default=None, alias="originalPrompt")
    title: str
    summary: str = ""
    source_note_ids: list[str] = Field(default_factory=list, alias="sourceNoteIds")
    days: list[GuideDay] = Field(min_length=1)
    budget_summary: str = Field(default="", alias="budgetSummary")
    risk_tips: list[str] = Field(default_factory=list, alias="riskTips")


class EnhanceGuideRequest(BaseModel):
    prompt: str = Field(min_length=1, max_length=500)
    guide: GeneratedGuide


class EnhanceGuideResponse(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    guide: GeneratedGuide
    source_note_count: int = Field(alias="sourceNoteCount")


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


class Author(BaseModel):
    user_id: str = ""
    nickname: str = ""


class CrawledComment(BaseModel):
    comment_id: str
    note_id: str = ""
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
