from typing import Protocol

from ..models import CrawledNote, NoteType, SortBy


class SourceError(RuntimeError):
    """Raised when an external note source cannot complete a request."""


class NoteSource(Protocol):
    def search_notes(
        self,
        keyword: str,
        limit: int,
        sort_by: SortBy,
        note_type: NoteType,
        include_comments: bool,
    ) -> list[CrawledNote]: ...
