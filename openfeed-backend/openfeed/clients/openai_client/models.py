from typing import Literal

from pydantic import BaseModel


class Message(BaseModel, frozen=True):
    role: Literal["system", "user", "assistant"]
    content: str
