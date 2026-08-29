import asyncio
from datetime import UTC, datetime
from typing import Protocol

from ..models import CrawledNote, NoteType, SortBy


class NoteSource(Protocol):
    def search_notes(
        self,
        keyword: str,
        limit: int,
        sort_by: SortBy,
        note_type: NoteType,
        include_comments: bool,
    ) -> list[CrawledNote]: ...


class DirectXhsCrawler:
    """Async adapter that runs the blocking Spider_XHS client in a worker thread."""

    def __init__(self, source: NoteSource):
        self._source = source

    async def search_latest_notes(
        self,
        keyword: str,
        limit: int,
    ) -> list[CrawledNote]:
        notes = await asyncio.to_thread(
            self._source.search_notes,
            keyword,
            limit,
            SortBy.LATEST,
            NoteType.ALL,
            True,
        )
        return sort_notes_newest_first(notes)


def sort_notes_newest_first(notes: list[CrawledNote]) -> list[CrawledNote]:
    return sorted(notes, key=_published_at, reverse=True)


def _published_at(note: CrawledNote) -> datetime:
    if not note.published_at:
        return datetime.min.replace(tzinfo=UTC)
    try:
        published_at = datetime.fromisoformat(
            note.published_at.replace("Z", "+00:00")
        )
        if published_at.tzinfo is None:
            return published_at.replace(tzinfo=UTC)
        return published_at
    except ValueError:
        return datetime.min.replace(tzinfo=UTC)
