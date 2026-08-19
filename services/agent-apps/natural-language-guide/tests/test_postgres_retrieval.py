import os
import unittest
from uuid import uuid4

from app.retrieval.models import GuideChunk, GuideSearchQuery, IndexedGuide


class FakeEmbeddings:
    dimensions = 3

    def embed_documents(self, texts):
        return [self._embed(text) for text in texts]

    def embed_query(self, text):
        return self._embed(text)

    @staticmethod
    def _embed(text):
        lowered = text.lower()
        return [
            float("成都" in text),
            float("美食" in text),
            float("海边" in text or "beach" in lowered),
        ]


@unittest.skipUnless(
    os.getenv("TEST_RAG_DATABASE_URL"),
    "TEST_RAG_DATABASE_URL is required for pgvector integration tests",
)
class PostgresGuideStoreIntegrationTest(unittest.TestCase):
    def test_indexes_and_retrieves_only_the_requested_user(self):
        from app.retrieval.postgres import PostgresGuideStore

        store = PostgresGuideStore(
            os.environ["TEST_RAG_DATABASE_URL"],
            FakeEmbeddings(),
            FakeEmbeddings.dimensions,
        )
        suffix = uuid4().hex
        guide_id = f"guide-{suffix}"
        target_chunk_id = str(uuid4())
        store.replace_guide(
            IndexedGuide(
                user_id=f"user-{suffix}",
                guide_id=guide_id,
                revision=1,
                destination="成都",
                payload={"title": "成都美食游"},
                chunks=[
                    GuideChunk(
                        chunk_id=target_chunk_id,
                        guide_id=guide_id,
                        chunk_type="guide_day",
                        content="成都美食低强度路线",
                        destination="成都",
                    )
                ],
            )
        )

        matches = store.search(
            GuideSearchQuery(
                text="成都美食",
                user_id=f"user-{suffix}",
                destination="成都",
                limit=5,
            )
        )
        other_user_matches = store.search(
            GuideSearchQuery(
                text="成都美食",
                user_id=f"other-{suffix}",
                destination="成都",
                limit=5,
            )
        )

        self.assertIn(target_chunk_id, [match.chunk_id for match in matches])
        self.assertEqual([], other_user_matches)


if __name__ == "__main__":
    unittest.main()
