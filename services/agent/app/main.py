from fastapi import FastAPI
from pydantic import BaseModel


class GenerateRequest(BaseModel):
    trip_id: str
    destination: str
    days: int
    source_note_ids: list[str] = []


app = FastAPI(title="PinTrip Agent")


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "UP", "service": "pintrip-agent"}


@app.post("/agent/generate")
def generate(request: GenerateRequest) -> dict:
    return {
        "trip_id": request.trip_id,
        "title": f"{request.destination} {request.days}日旅行攻略",
        "summary": "Agent scaffold response. Replace with planning workflow.",
        "sourceNoteIds": request.source_note_ids,
        "days": [],
    }
