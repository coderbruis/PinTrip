import httpx


class LocalJavaEmbeddingClient:
    """Uses the model embedded in Admin API instead of a paid embedding API."""

    def __init__(
        self,
        base_url: str,
        internal_key: str,
        dimensions: int = 512,
        timeout: float = 60,
    ):
        self._url = f"{base_url.rstrip('/')}/api/internal/embeddings"
        self._internal_key = internal_key
        self._dimensions = dimensions
        self._timeout = timeout

    def embed_documents(self, texts: list[str]) -> list[list[float]]:
        return self._embed(texts)

    def embed_query(self, text: str) -> list[float]:
        return self._embed([text])[0]

    def _embed(self, inputs: list[str]) -> list[list[float]]:
        response = httpx.post(
            self._url,
            headers={"X-PinTrip-Internal-Key": self._internal_key},
            json={"inputs": inputs},
            timeout=self._timeout,
        )
        response.raise_for_status()
        payload = response.json()
        if payload.get("dimensions") != self._dimensions:
            raise ValueError("local embedding service returned an unexpected dimension")
        embeddings = payload.get("embeddings")
        if not isinstance(embeddings, list) or len(embeddings) != len(inputs):
            raise ValueError("local embedding service returned an unexpected vector count")
        return embeddings
