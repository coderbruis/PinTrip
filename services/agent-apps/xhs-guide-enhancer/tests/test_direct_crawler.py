import asyncio
import unittest

from app.infrastructure import DirectXhsCrawler
from app.models import CrawledNote, NoteType, SortBy


class FakeNoteSource:
    def __init__(self):
        self.arguments = None

    def search_notes(self, keyword, limit, sort_by, note_type, include_comments):
        self.arguments = (keyword, limit, sort_by, note_type, include_comments)
        return [
            CrawledNote(
                note_id="old",
                note_url="https://example.test/old",
                published_at="2026-01-01T00:00:00+00:00",
            ),
            CrawledNote(
                note_id="new",
                note_url="https://example.test/new",
                published_at="2026-08-01T00:00:00+00:00",
            ),
        ]


class DirectXhsCrawlerTest(unittest.TestCase):
    def test_requests_latest_notes_and_sorts_newest_first(self) -> None:
        source = FakeNoteSource()
        notes = asyncio.run(
            DirectXhsCrawler(source).search_latest_notes("成都攻略", 5)
        )

        self.assertEqual(
            ("成都攻略", 5, SortBy.LATEST, NoteType.ALL, True),
            source.arguments,
        )
        self.assertEqual(["new", "old"], [note.note_id for note in notes])


if __name__ == "__main__":
    unittest.main()
