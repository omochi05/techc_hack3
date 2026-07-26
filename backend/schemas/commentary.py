from typing import Literal

from pydantic import BaseModel, Field


EventType = Literal[
    "match_start",
    "punch",
    "strong_punch",
    "combo",
    "low_health",
    "knockdown",
    "match_end",
]


class CommentaryRequest(BaseModel):
    event_type: EventType
    player: str | None = None
    power: int | None = Field(default=None, ge=0, le=100)
    combo_count: int | None = Field(default=None, ge=1)
    player1_hp: int | None = Field(default=None, ge=0, le=100)
    player2_hp: int | None = Field(default=None, ge=0, le=100)
    winner: str | None = None


class CommentaryResponse(BaseModel):
    commentary: str