import unittest

from app.models import GeneratedItinerary, IndexUserGuideRequest
from app.retrieval.indexing import UserGuideChunker, UserGuideIndexer


def guide_fixture() -> GeneratedItinerary:
    return GeneratedItinerary.model_validate(
        {
            "title": "成都两日游",
            "summary": "低强度美食路线",
            "days": [
                {
                    "day": 1,
                    "title": "老城漫步",
                    "items": [
                        {
                            "time": "09:00",
                            "place": "宽窄巷子",
                            "activity": "散步并品尝小吃",
                            "transport": "地铁",
                            "tips": ["避开午间高峰"],
                        }
                    ],
                }
            ],
            "budgetSummary": "人均 800 元",
            "riskTips": ["提前确认开放时间"],
        }
    )


class FakeGuideIndexStore:
    def __init__(self):
        self.guides = []

    def replace_guide(self, guide):
        self.guides.append(guide)
        return len(guide.chunks)


class UserGuideIndexingTest(unittest.TestCase):
    def test_chunks_guide_by_business_semantics(self):
        chunks = UserGuideChunker().split(
            user_id="user-1",
            guide_id="guide-1",
            revision=1,
            destination="成都",
            guide=guide_fixture(),
        )

        self.assertEqual(
            [
                "guide_summary",
                "guide_day",
                "place_experience",
                "budget",
                "risk_tip",
            ],
            [chunk.chunk_type for chunk in chunks],
        )
        self.assertIn("宽窄巷子", chunks[2].content)
        self.assertEqual("宽窄巷子", chunks[2].place)
        self.assertEqual(len(chunks), len({chunk.chunk_id for chunk in chunks}))

    def test_indexes_canonical_guide_and_chunks(self):
        store = FakeGuideIndexStore()
        indexer = UserGuideIndexer(store)
        request = IndexUserGuideRequest(
            user_id="user-1",
            guide_id="guide-1",
            destination="成都旅游攻略",
            guide=guide_fixture(),
        )

        count = indexer.index(request)

        self.assertEqual(5, count)
        self.assertEqual("成都", store.guides[0].destination)
        self.assertEqual("guide-1", store.guides[0].guide_id)
        self.assertEqual("成都两日游", store.guides[0].payload["title"])


if __name__ == "__main__":
    unittest.main()
