import json
from typing import TypeVar

from pydantic import BaseModel


ModelType = TypeVar("ModelType", bound=BaseModel)


def parse_model(response: str, model_type: type[ModelType]) -> ModelType:
    payload = extract_json_object(response)
    return model_type.model_validate(payload)


def extract_json_object(response: str) -> dict:
    text = response.strip()
    if "```json" in text:
        text = text.split("```json", 1)[1].split("```", 1)[0].strip()
    elif "```" in text:
        text = text.split("```", 1)[1].split("```", 1)[0].strip()

    object_start = text.find("{")
    if object_start < 0:
        raise ValueError("Agent response does not contain a JSON object")

    payload, _ = json.JSONDecoder().raw_decode(text[object_start:])
    if not isinstance(payload, dict):
        raise ValueError("Agent response JSON must be an object")
    return payload
