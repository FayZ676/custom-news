from typing import TypeVar

from openai import OpenAI
from pydantic import BaseModel

from openfeed.config import settings


T = TypeVar("T", bound=BaseModel)


client = OpenAI(api_key=settings.openai_api_key)


def generate_response(prompt: str, response_model: type[T]) -> T:
    response = client.responses.parse(
        model="gpt-5.4",
        input=prompt,
        text_format=response_model,
    )
    return response.output_parsed  # type: ignore
