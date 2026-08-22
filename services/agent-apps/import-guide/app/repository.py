from threading import Lock

from .models import KnowledgeItem


class KnowledgeRepository:
    def __init__(self) -> None:
        self._items: dict[str, KnowledgeItem] = {}
        self._lock = Lock()

    def list(self) -> list[KnowledgeItem]:
        with self._lock:
            return sorted(self._items.values(), key=lambda item: item.updated_at, reverse=True)

    def save(self, item: KnowledgeItem) -> KnowledgeItem:
        with self._lock:
            self._items[item.id] = item
        return item

    def get(self, knowledge_id: str) -> KnowledgeItem | None:
        with self._lock:
            return self._items.get(knowledge_id)
