import json
from typing import TypeVar

from pydantic import BaseModel


ModelType = TypeVar("ModelType", bound=BaseModel)


def parse_model(response: str, model_type: type[ModelType]) -> ModelType:
    text = response.strip()
    if "```json" in text:
        text = text.split("```json", 1)[1].split("```", 1)[0].strip()
    elif "```" in text:
        text = text.split("```", 1)[1].split("```", 1)[0].strip()

    start = text.find("{")
    if start < 0:
        raise ValueError("Agent response does not contain a JSON object")
    payload, _ = json.JSONDecoder().raw_decode(text[start:])
    return model_type.model_validate(payload)
