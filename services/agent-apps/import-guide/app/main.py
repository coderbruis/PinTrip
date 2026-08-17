from fastapi import FastAPI
from pydantic import BaseModel, Field


class ImportedNote(BaseModel):
    note_id: str
    title: str
    content: str
    tags: list[str] = Field(default_factory=list)


class ImportGuideRequest(BaseModel):
    trip_id: str
    destination: str
    days: int
    source_notes: list[ImportedNote] = Field(default_factory=list)


app = FastAPI(title="PinTrip Import Guide Service")


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "UP", "service": "pintrip-import-guide-service"}


@app.post("/agent/import-guide/generate")
def generate_from_imports(request: ImportGuideRequest) -> dict:
    return {
        "trip_id": request.trip_id,
        "title": f"{request.destination} {request.days}日旅行攻略",
        "summary": "Import guide agent scaffold response. Replace with note understanding workflow.",
        "sourceNoteIds": [note.note_id for note in request.source_notes],
        "days": [],
    }
