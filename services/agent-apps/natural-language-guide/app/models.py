from datetime import date

from pydantic import BaseModel, ConfigDict, Field


class NaturalLanguageGuideRequest(BaseModel):
    trip_id: str = Field(min_length=1)
    prompt: str = Field(min_length=1)
    destination: str | None = None
    days: int | None = Field(default=None, ge=1, le=30)
    start_date: date | None = None
    transportation: str | None = None
    accommodation: str | None = None
    preferences: list[str] = Field(default_factory=list)


class ResolvedTripIntent(BaseModel):
    destination: str = Field(min_length=1)
    days: int = Field(ge=1, le=30)
    transportation: str = "公共交通"
    accommodation: str = "舒适型酒店"
    preferences: list[str] = Field(default_factory=list)
    requirements: list[str] = Field(default_factory=list)


class GuideItem(BaseModel):
    time: str
    place: str
    activity: str
    transport: str | None = None
    tips: list[str] = Field(default_factory=list)


class GuideDay(BaseModel):
    day: int = Field(ge=1)
    title: str
    items: list[GuideItem] = Field(min_length=1)


class GeneratedItinerary(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    title: str
    summary: str = ""
    source_note_ids: list[str] = Field(default_factory=list, alias="sourceNoteIds")
    days: list[GuideDay] = Field(min_length=1)
    budget_summary: str = Field(default="", alias="budgetSummary")
    risk_tips: list[str] = Field(default_factory=list, alias="riskTips")


class NaturalLanguageGuideResponse(GeneratedItinerary):
    model_config = ConfigDict(populate_by_name=True)

    trip_id: str
    original_prompt: str = Field(alias="originalPrompt")
