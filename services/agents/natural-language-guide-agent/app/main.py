from fastapi import FastAPI
from pydantic import BaseModel


class NaturalLanguageGuideRequest(BaseModel):
    trip_id: str
    prompt: str
    destination: str | None = None
    days: int | None = None


app = FastAPI(title="PinTrip Natural Language Guide Agent")


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "UP", "service": "pintrip-natural-language-guide-agent"}


@app.post("/agent/natural-language-guide/generate")
def generate_from_natural_language(request: NaturalLanguageGuideRequest) -> dict:
    destination = request.destination or "自定义目的地"
    duration = f"{request.days}日" if request.days else ""

    return {
        "trip_id": request.trip_id,
        "title": f"{destination}{duration}旅行攻略",
        "summary": "Natural language guide agent scaffold response. Replace with intent planning workflow.",
        "sourceNoteIds": [],
        "days": [],
        "originalPrompt": request.prompt,
    }
