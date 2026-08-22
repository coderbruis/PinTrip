from datetime import datetime
from uuid import uuid4

from fastapi import BackgroundTasks, FastAPI, HTTPException

from .chunker import chunk_text
from .indexer import IndexDocument, create_indexer
from .models import ChunkPreview, ImportKnowledgeRequest, KnowledgeItem, KnowledgeList, format_updated_at
from .repository import KnowledgeRepository

app = FastAPI(title="PinTrip RAG Knowledge Import Service")
repository = KnowledgeRepository()
indexer = create_indexer()


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "UP", "service": "pintrip-rag-knowledge-service"}


@app.get("/rag/knowledge", response_model=KnowledgeList, response_model_by_alias=True)
def list_knowledge() -> KnowledgeList:
    return KnowledgeList(items=repository.list())


@app.get("/rag/knowledge/{knowledge_id}", response_model=KnowledgeItem, response_model_by_alias=True)
def get_knowledge(knowledge_id: str) -> KnowledgeItem:
    item = repository.get(knowledge_id)
    if item is None:
        raise HTTPException(status_code=404, detail="知识条目不存在")
    return item


@app.post("/rag/knowledge/preview", response_model=ChunkPreview, response_model_by_alias=True)
def preview_knowledge(request: ImportKnowledgeRequest) -> ChunkPreview:
    chunks = chunk_text(request.content.strip(), request.chunk_size, request.chunk_overlap)
    return ChunkPreview(chunk_count=len(chunks), chunks=chunks)


@app.post("/rag/knowledge/import", response_model=KnowledgeItem, response_model_by_alias=True, status_code=202)
def import_knowledge(request: ImportKnowledgeRequest, background_tasks: BackgroundTasks) -> KnowledgeItem:
    chunks = chunk_text(request.content.strip(), request.chunk_size, request.chunk_overlap)
    knowledge_id = f"KB-{uuid4().hex[:8].upper()}"
    source = "运营导入" if request.source_type == "operator" else "用户沉淀"
    item = KnowledgeItem(
        id=knowledge_id,
        title=request.title.strip(),
        destination=request.destination.strip(),
        source=source,
        source_type=request.source_type,
        chunk_count=len(chunks),
        status="indexing",
        updated_at=format_updated_at(datetime.now().astimezone()),
        tags=[tag.strip() for tag in request.tags if tag.strip()],
        content=request.content.strip(),
        chunks=chunks,
    )
    repository.save(item)
    background_tasks.add_task(index_knowledge, item)
    return item


def index_knowledge(item: KnowledgeItem) -> None:
    try:
        indexer.index(IndexDocument(item.id, item.title, item.destination, item.tags, item.chunks))
        item = item.model_copy(update={"status": "published"})
    except Exception as error:
        item = item.model_copy(update={"status": "failed", "error_message": str(error)})
    repository.save(item)


# Keep the original scaffold endpoint available for existing callers.
@app.post("/agent/import-guide/generate")
def generate_from_imports(request: dict) -> dict:
    return {
        "trip_id": request.get("trip_id", ""),
        "title": f"{request.get('destination', '')} {request.get('days', '')}日旅行攻略",
        "summary": "Import guide agent scaffold response.",
        "sourceNoteIds": [note.get("note_id") for note in request.get("source_notes", [])],
        "days": [],
    }
