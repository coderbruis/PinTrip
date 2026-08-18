import asyncio
import json
import unittest

from app.models import CrawledNote, EnhanceGuideRequest
from app.service import EnhancementError, XhsGuideEnhancementService


def guide_payload() -> dict:
    return {
        "trip_id": "trip-1",
        "originalPrompt": "成都两天游",
        "title": "成都两日攻略",
        "summary": "基础攻略",
        "sourceNoteIds": [],
        "days": [
            {
                "day": 1,
                "title": "城市人文",
                "imageUrl": "https://example.test/day.jpg",
                "items": [
                    {
                        "time": "09:00",
                        "place": "武侯祠",
                        "activity": "游览",
                        "tips": [],
                    }
                ],
            }
        ],
        "budgetSummary": "人均500元",
        "riskTips": [],
    }


class FakeCrawler:
    def __init__(self):
        self.calls = []

    async def search_latest_notes(self, keyword: str, limit: int):
        self.calls.append((keyword, limit))
        return [
            CrawledNote(
                note_id="old",
                note_url="https://example.test/old",
                title="旧笔记",
                published_at="2026-01-01T00:00:00+00:00",
            ),
            CrawledNote(
                note_id="new",
                note_url="https://example.test/new",
                title="新笔记",
                published_at="2026-08-01T00:00:00+00:00",
            ),
        ]


class FakeMerger:
    def __init__(self):
        self.query = ""

    def merge(self, query: str) -> str:
        self.query = query
        return json.dumps(guide_payload(), ensure_ascii=False)


class FailingCrawler:
    async def search_latest_notes(self, keyword: str, limit: int):
        raise RuntimeError("crawler is not ready")


class XhsGuideEnhancementServiceTest(unittest.TestCase):
    def test_crawls_places_and_passes_newest_notes_first(self) -> None:
        crawler = FakeCrawler()
        merger = FakeMerger()
        service = XhsGuideEnhancementService(
            crawler=crawler,
            merger=merger,
            max_locations=8,
            notes_per_location=5,
            max_evidence_notes=20,
            concurrency=3,
        )

        response = asyncio.run(
            service.enhance(
                EnhanceGuideRequest(
                    prompt="成都两天游",
                    guide=guide_payload(),
                )
            )
        )

        self.assertEqual(
            [("成都两日攻略 武侯祠 游玩攻略 避坑", 5)], crawler.calls
        )
        self.assertLess(
            merger.query.index('"note_id": "new"'),
            merger.query.index('"note_id": "old"'),
        )
        self.assertEqual(["new", "old"], response.guide.source_note_ids)
        self.assertEqual(2, response.source_note_count)

    def test_reports_crawler_failure_when_all_locations_fail(self) -> None:
        service = XhsGuideEnhancementService(
            crawler=FailingCrawler(),
            merger=FakeMerger(),
            max_locations=8,
            notes_per_location=5,
            max_evidence_notes=20,
            concurrency=3,
        )

        with self.assertRaisesRegex(EnhancementError, "crawler is not ready"):
            asyncio.run(
                service.enhance(
                    EnhanceGuideRequest(
                        prompt="成都两天游",
                        guide=guide_payload(),
                    )
                )
            )


if __name__ == "__main__":
    unittest.main()
