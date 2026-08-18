import asyncio
import unittest

import httpx

from app.infrastructure.crawler_client import CrawlerApiClient


class CrawlerApiClientTest(unittest.TestCase):
    def test_requests_latest_sort_and_sorts_response_newest_first(self) -> None:
        captured = {}

        def handler(request: httpx.Request) -> httpx.Response:
            captured.update(__import__("json").loads(request.content))
            return httpx.Response(
                200,
                json={
                    "notes": [
                        {
                            "note_id": "old",
                            "note_url": "https://example.test/old",
                            "published_at": "2026-01-01T00:00:00+00:00",
                        },
                        {
                            "note_id": "new",
                            "note_url": "https://example.test/new",
                            "published_at": "2026-08-01T00:00:00+00:00",
                        },
                    ]
                },
            )

        async def run():
            async with httpx.AsyncClient(
                transport=httpx.MockTransport(handler)
            ) as http_client:
                client = CrawlerApiClient(
                    "http://crawler.test",
                    timeout=10,
                    client=http_client,
                )
                return await client.search_latest_notes("成都攻略", 5)

        notes = asyncio.run(run())

        self.assertEqual(1, captured["sort_by"])
        self.assertTrue(captured["include_comments"])
        self.assertEqual(["new", "old"], [note.note_id for note in notes])


if __name__ == "__main__":
    unittest.main()
