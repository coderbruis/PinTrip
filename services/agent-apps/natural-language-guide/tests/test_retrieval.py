import unittest

from app.models import ResolvedTripIntent
from app.retrieval.models import GuideChunk, GuideChunkMatch
from app.retrieval.service import UserGuideRetriever


class FakeVectorStore:
    def __init__(self):
        self.queries = []

    def search(self, query):
        self.queries.append(query)
        return [
            GuideChunkMatch(chunk_id="chunk-low", score=0.5),
            GuideChunkMatch(chunk_id="chunk-high", score=0.9),
        ]


class FakeGuideRepository:
    def __init__(self):
        self.calls = []

    def find_accessible_chunks(self, user_id, chunk_ids):
        self.calls.append((user_id, chunk_ids))
        return [
            GuideChunk(
                chunk_id="chunk-low",
                guide_id="guide-1",
                chunk_type="budget",
                content="人均预算 1000 元",
            ),
            GuideChunk(
                chunk_id="chunk-high",
                guide_id="guide-2",
                chunk_type="guide_day",
                content="成都低强度一日路线",
                destination="成都",
            ),
        ]


class UserGuideRetrieverTest(unittest.TestCase):
    def setUp(self):
        self.vector_store = FakeVectorStore()
        self.repository = FakeGuideRepository()
        self.retriever = UserGuideRetriever(
            self.vector_store,
            self.repository,
            limit=2,
        )
        self.intent = ResolvedTripIntent(
            destination="成都",
            days=2,
            preferences=["美食"],
            requirements=["低强度"],
        )

    def test_requires_user_scope_before_searching(self):
        result = self.retriever.retrieve(
            user_id=None,
            intent=self.intent,
            prompt="成都两日游",
        )

        self.assertEqual([], result)
        self.assertEqual([], self.vector_store.queries)

    def test_searches_with_scope_and_hydrates_ranked_evidence(self):
        result = self.retriever.retrieve(
            user_id="user-1",
            intent=self.intent,
            prompt="参考我以前的低强度路线",
        )

        query = self.vector_store.queries[0]
        self.assertEqual("user-1", query.user_id)
        self.assertEqual("成都", query.destination)
        self.assertIn("美食", query.text)
        self.assertIn("低强度", query.text)
        self.assertEqual(
            ("user-1", ["chunk-low", "chunk-high"]),
            self.repository.calls[0],
        )
        self.assertEqual(
            ["chunk-high", "chunk-low"],
            [item.chunk_id for item in result],
        )
        self.assertEqual(0.9, result[0].score)


if __name__ == "__main__":
    unittest.main()
