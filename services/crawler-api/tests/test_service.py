import unittest

from app.models import (
    CrawlSearchRequest,
    CrawledNote,
    NoteType,
    SortBy,
)
from app.service import CrawlService


class FakeNoteSource:
    def __init__(self) -> None:
        self.arguments = None

    def search_notes(
        self,
        keyword,
        limit,
        sort_by,
        note_type,
        include_comments,
    ):
        self.arguments = (
            keyword,
            limit,
            sort_by,
            note_type,
            include_comments,
        )
        return [
            CrawledNote(
                note_id="note-1",
                note_url="https://example.test/note-1",
                title="成都旅行",
                content="三天路线",
            )
        ]


class CrawlServiceTest(unittest.TestCase):
    def test_search_delegates_to_source_and_counts_results(self):
        source = FakeNoteSource()
        service = CrawlService(source)

        response = service.search(
            CrawlSearchRequest(
                keyword=" 成都旅行 ",
                limit=10,
                sort_by=SortBy.LATEST,
                note_type=NoteType.IMAGE_TEXT,
                include_comments=False,
            )
        )

        self.assertEqual("成都旅行", response.keyword)
        self.assertEqual(1, response.returned_count)
        self.assertEqual("note-1", response.notes[0].note_id)
        self.assertEqual(
            ("成都旅行", 10, SortBy.LATEST, NoteType.IMAGE_TEXT, False),
            source.arguments,
        )


if __name__ == "__main__":
    unittest.main()
