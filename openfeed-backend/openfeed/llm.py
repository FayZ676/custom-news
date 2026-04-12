from typing import TypeVar

import requests
from pydantic import BaseModel

from openfeed.config import settings


T = TypeVar("T", bound=BaseModel)


def generate_response(prompt: str, response_model: type[T]) -> T:
    schema = response_model.model_json_schema()
    schema["additionalProperties"] = False
    body: dict = {
        "model": "gpt-5.4",
        "input": prompt,
        "text": {
            "format": {
                "type": "json_schema",
                "name": response_model.__name__,
                "strict": True,
                "schema": schema,
            }
        },
    }

    response = requests.post(
        "https://api.openai.com/v1/responses",
        headers={
            "Content-Type": "application/json",
            "Authorization": f"Bearer {settings.openai_api_key}",
        },
        json=body,
        timeout=(10, 30),
    )
    response.raise_for_status()
    text = response.json()["output"][0]["content"][0]["text"]
    return response_model.model_validate_json(text)
