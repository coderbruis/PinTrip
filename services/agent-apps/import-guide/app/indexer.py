import json
import os
from dataclasses import dataclass
from urllib.request import Request, urlopen


@dataclass(frozen=True)
class IndexDocument:
    knowledge_id: str
    title: str
    destination: str
    tags: list[str]
    chunks: list[str]


class RagIndexer:
    def index(self, document: IndexDocument) -> None:
        raise NotImplementedError


class LocalRagIndexer(RagIndexer):
    """Development indexer: validates chunk output without an external vector store."""

    def index(self, document: IndexDocument) -> None:
        if not document.chunks:
            raise ValueError("攻略正文未生成有效知识分块")


class HttpRagIndexer(RagIndexer):
    def __init__(self, endpoint: str) -> None:
        self.endpoint = endpoint

    def index(self, document: IndexDocument) -> None:
        payload = json.dumps({
            "knowledgeId": document.knowledge_id,
            "title": document.title,
            "destination": document.destination,
            "tags": document.tags,
            "chunks": document.chunks,
        }, ensure_ascii=False).encode("utf-8")
        request = Request(self.endpoint, data=payload, headers={"Content-Type": "application/json"}, method="POST")
        with urlopen(request, timeout=15) as response:
            if response.status >= 300:
                raise RuntimeError(f"RAG 索引接口返回 {response.status}")


def create_indexer() -> RagIndexer:
    endpoint = os.getenv("RAG_INDEX_URL", "").strip()
    return HttpRagIndexer(endpoint) if endpoint else LocalRagIndexer()
