import asyncio
import json
import logging
from typing import Any

from .agents import GuideMergerRunner
from .infrastructure import DirectXhsCrawler, sort_notes_newest_first
from .models import (
    CrawledNote,
    EnhanceGuideRequest,
    EnhanceGuideResponse,
    GeneratedGuide,
)
from .parsing import parse_model


logger = logging.getLogger("uvicorn.error.pintrip.xhs-service")


class EnhancementError(RuntimeError):
    """Raised when no valid enhanced guide can be produced."""


class XhsGuideEnhancementService:
    def __init__(
        self,
        crawler: DirectXhsCrawler,
        merger: GuideMergerRunner,
        max_locations: int,
        notes_per_location: int,
        max_evidence_notes: int,
        concurrency: int,
    ):
        self._crawler = crawler
        self._merger = merger
        self._max_locations = max_locations
        self._notes_per_location = notes_per_location
        self._max_evidence_notes = max_evidence_notes
        self._concurrency = concurrency

    async def enhance(self, request: EnhanceGuideRequest) -> EnhanceGuideResponse:
        locations = self._extract_locations(request.guide)
        if not locations:
            raise EnhancementError("Base guide contains no searchable locations")

        notes, crawl_errors = await self._crawl_locations(
            locations,
            request.guide.title,
        )
        notes = self._deduplicate_newest_first(notes)[: self._max_evidence_notes]
        if not notes:
            reason = "; ".join(crawl_errors[:3]) or "search returned no notes"
            raise EnhancementError(f"No Xiaohongshu notes were available: {reason}")

        query = self._build_merge_query(request, notes)
        try:
            response = await asyncio.to_thread(self._merger.merge, query)
            enhanced = parse_model(response, GeneratedGuide)
        except Exception as error:
            raise EnhancementError(f"Unable to merge crawled evidence: {error}") from error

        if len(enhanced.days) != len(request.guide.days):
            raise EnhancementError("Enhanced guide changed the number of trip days")

        enhanced.trip_id = request.guide.trip_id
        enhanced.original_prompt = request.guide.original_prompt or request.prompt
        enhanced.source_note_ids = [note.note_id for note in notes]
        return EnhanceGuideResponse(
            guide=enhanced,
            sourceNoteCount=len(notes),
        )

    def _extract_locations(self, guide: GeneratedGuide) -> list[str]:
        locations: list[str] = []
        seen: set[str] = set()
        for day in guide.days:
            for item in day.items:
                place = item.place.strip()
                if not place or place in seen:
                    continue
                seen.add(place)
                locations.append(place)
                if len(locations) >= self._max_locations:
                    return locations
        return locations

    async def _crawl_locations(
        self,
        locations: list[str],
        guide_title: str,
    ) -> tuple[list[CrawledNote], list[str]]:
        semaphore = asyncio.Semaphore(self._concurrency)

        async def crawl(place: str) -> tuple[list[CrawledNote], str | None]:
            async with semaphore:
                try:
                    return (
                        await self._crawler.search_latest_notes(
                            f"{guide_title} {place} 游玩攻略 避坑",
                            self._notes_per_location,
                        ),
                        None,
                    )
                except Exception as error:
                    message = f"{place}: {error}"
                    logger.warning("crawl.location_failed %s", message)
                    return [], message

        batches = await asyncio.gather(*(crawl(place) for place in locations))
        notes = [note for batch, _ in batches for note in batch]
        errors = [error for _, error in batches if error]
        return notes, errors

    @staticmethod
    def _deduplicate_newest_first(notes: list[CrawledNote]) -> list[CrawledNote]:
        unique: dict[str, CrawledNote] = {}
        for note in sort_notes_newest_first(notes):
            unique.setdefault(note.note_id, note)
        return list(unique.values())

    @staticmethod
    def _build_merge_query(
        request: EnhanceGuideRequest,
        notes: list[CrawledNote],
    ) -> str:
        evidence = [XhsGuideEnhancementService._to_evidence(note) for note in notes]
        schema = GeneratedGuide.model_json_schema()
        return f"""请用小红书证据增强基础攻略。

用户原始需求：{request.prompt}

基础攻略：
{request.guide.model_dump_json(by_alias=True)}

小红书证据（已按笔记发布时间从新到旧排列）：
{json.dumps(evidence, ensure_ascii=False)}

输出 JSON Schema：
{json.dumps(schema, ensure_ascii=False)}
"""

    @staticmethod
    def _to_evidence(note: CrawledNote) -> dict[str, Any]:
        comments = sorted(
            note.comments,
            key=lambda comment: comment.like_count,
            reverse=True,
        )[:8]
        return {
            "note_id": note.note_id,
            "note_url": note.note_url,
            "published_at": note.published_at,
            "title": note.title[:300],
            "content": note.content[:1600],
            "tags": note.tags[:20],
            "liked_count": note.liked_count,
            "collected_count": note.collected_count,
            "comments": [
                {
                    "content": comment.content[:300],
                    "like_count": comment.like_count,
                    "created_at": comment.created_at,
                }
                for comment in comments
            ],
        }
