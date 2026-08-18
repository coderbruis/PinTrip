import unittest
from unittest.mock import patch

from fastapi.testclient import TestClient

from app.main import app
from app.models import CrawlSearchResponse


class FakeCrawlService:
    def search(self, request):
        return CrawlSearchResponse(
            keyword=request.keyword,
            requested_count=request.limit,
            returned_count=0,
            notes=[],
        )


class CrawlerApiTest(unittest.TestCase):
    def test_agent_search_contract(self):
        with patch("app.main.get_crawl_service", return_value=FakeCrawlService()):
            response = TestClient(app).post(
                "/crawl/xhs/search",
                json={
                    "keyword": "成都旅行",
                    "limit": 5,
                    "include_comments": True,
                },
            )

        self.assertEqual(200, response.status_code)
        self.assertEqual(
            {
                "keyword": "成都旅行",
                "requested_count": 5,
                "returned_count": 0,
                "notes": [],
            },
            response.json(),
        )


if __name__ == "__main__":
    unittest.main()
