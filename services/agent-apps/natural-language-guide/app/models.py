import re
from datetime import date

from pydantic import BaseModel, ConfigDict, Field, field_validator


TRAVEL_QUERY_SUFFIX_PATTERN = re.compile(
    r"(?:(?:旅游攻略|旅行攻略|自由行攻略|自驾攻略|游玩攻略|攻略|旅游|旅行|自由行|自驾游|游玩|行程|路线)\s*)+$"
)


def normalize_destination(value: str) -> str:
    normalized = value.strip()
    without_suffix = TRAVEL_QUERY_SUFFIX_PATTERN.sub("", normalized).strip()
    return without_suffix or normalized


class NaturalLanguageGuideRequest(BaseModel):
    trip_id: str = Field(min_length=1)
    user_id: str | None = Field(default=None, min_length=1)
    prompt: str = Field(min_length=1)
    destination: str | None = Field(default=None, min_length=1)
    days: int | None = Field(default=None, ge=1, le=30)
    start_date: date | None = None
    transportation: str | None = None
    accommodation: str | None = None
    preferences: list[str] = Field(default_factory=list)

    @field_validator("destination", mode="before")
    @classmethod
    def clean_destination(cls, value: str | None) -> str | None:
        return normalize_destination(value) if value else value


class ResolvedTripIntent(BaseModel):
    destination: str = Field(min_length=1)
    days: int = Field(ge=1, le=30)
    transportation: str = "公共交通"
    accommodation: str = "舒适型酒店"
    preferences: list[str] = Field(default_factory=list)
    requirements: list[str] = Field(default_factory=list)


class UserGuideEvidence(BaseModel):
    chunk_id: str = Field(min_length=1)
    guide_id: str = Field(min_length=1)
    chunk_type: str = Field(min_length=1)
    content: str = Field(min_length=1)
    destination: str | None = None
    place: str | None = None
    score: float | None = None


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
    image_url: str | None = Field(
        default=None,
        alias="imageUrl",
        pattern=r"^https?://",
    )
    items: list[GuideItem] = Field(min_length=1)


class GeneratedItinerary(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    title: str
    summary: str = ""
    source_note_ids: list[str] = Field(default_factory=list, alias="sourceNoteIds")
    days: list[GuideDay] = Field(min_length=1)
    budget_summary: str = Field(default="", alias="budgetSummary")
    risk_tips: list[str] = Field(default_factory=list, alias="riskTips")


class IndexUserGuideRequest(BaseModel):
    user_id: str = Field(min_length=1)
    guide_id: str = Field(min_length=1)
    destination: str = Field(min_length=1)
    revision: int = Field(default=1, ge=1)
    guide: GeneratedItinerary

    @field_validator("destination", mode="before")
    @classmethod
    def clean_index_destination(cls, value: str) -> str:
        return normalize_destination(value)


class IndexUserGuideResponse(BaseModel):
    guide_id: str
    revision: int
    chunk_count: int


class NaturalLanguageGuideResponse(GeneratedItinerary):
    model_config = ConfigDict(populate_by_name=True)

    trip_id: str
    original_prompt: str = Field(alias="originalPrompt")
