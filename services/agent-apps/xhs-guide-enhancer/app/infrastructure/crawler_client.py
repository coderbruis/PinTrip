from datetime import UTC, datetime

import httpx

from ..models import CrawledNote, CrawlSearchResponse


class CrawlerApiError(RuntimeError):
    """Raised when crawler-api cannot provide notes."""


class CrawlerApiClient:
    def __init__(
        self,
        base_url: str,
        timeout: float,
        client: httpx.AsyncClient | None = None,
    ):
        self._base_url = base_url.rstrip("/")
        self._timeout = timeout
        self._client = client

    async def search_latest_notes(
        self,
        keyword: str,
        limit: int,
    ) -> list[CrawledNote]:
        payload = {
            "keyword": keyword,
            "limit": limit,
            "sort_by": 1,
            "note_type": 0,
            "include_comments": True,
        }
        try:
            if self._client is not None:
                response = await self._client.post(
                    f"{self._base_url}/crawl/xhs/search",
                    json=payload,
                )
            else:
                async with httpx.AsyncClient(timeout=self._timeout) as client:
                    response = await client.post(
                        f"{self._base_url}/crawl/xhs/search",
                        json=payload,
                    )
            response.raise_for_status()
            result = CrawlSearchResponse.model_validate(response.json())
        except Exception as error:
            raise CrawlerApiError(
                f"crawler-api search failed for keyword '{keyword}': {error}"
            ) from error
        return sort_notes_newest_first(result.notes)


def sort_notes_newest_first(notes: list[CrawledNote]) -> list[CrawledNote]:
    return sorted(notes, key=_published_at, reverse=True)


def _published_at(note: CrawledNote) -> datetime:
    if not note.published_at:
        return datetime.min.replace(tzinfo=UTC)
    try:
        published_at = datetime.fromisoformat(
            note.published_at.replace("Z", "+00:00")
        )
        if published_at.tzinfo is None:
            return published_at.replace(tzinfo=UTC)
        return published_at
    except ValueError:
        return datetime.min.replace(tzinfo=UTC)
