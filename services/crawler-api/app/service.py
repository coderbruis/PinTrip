from .models import CrawlSearchRequest, CrawlSearchResponse
from .providers.base import NoteSource


class CrawlService:
    def __init__(self, source: NoteSource):
        self._source = source

    def search(self, request: CrawlSearchRequest) -> CrawlSearchResponse:
        notes = self._source.search_notes(
            keyword=request.keyword,
            limit=request.limit,
            sort_by=request.sort_by,
            note_type=request.note_type,
            include_comments=request.include_comments,
        )
        return CrawlSearchResponse(
            keyword=request.keyword,
            requested_count=request.limit,
            returned_count=len(notes),
            notes=notes,
        )
