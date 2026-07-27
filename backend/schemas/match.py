from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


MatchPlayer = Literal["playerA", "playerB"]

BoxingEventType = Literal[
    "punch",
    "timer",
    "round_start",
    "round_end",
]



class MatchCreate(BaseModel):
    player1_name: str = Field(
        min_length=1,
        max_length=100,
    )

    player2_name: str = Field(
        min_length=1,
        max_length=100,
    )


class MatchResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    player1_name: str
    player2_name: str
    player1_round_wins: int
    player2_round_wins: int
    winner_name: str | None
    status: str
    started_at: datetime | None
    finished_at: datetime | None
    created_at: datetime


class PunchCreateRequest(BaseModel):
    player: MatchPlayer

    power: float = Field(
        ge=0,
        description="パンチの威力",
    )


class PunchResponse(BaseModel):
    id: int
    player: MatchPlayer
    power: float
    timestamp: datetime


class LatestPunchResponse(BaseModel):
    punch: PunchResponse | None

class BoxingEventRequest(BaseModel):
    type: BoxingEventType

    round: int | None = Field(
        default=None,
        ge=1,
    )

    playerId: int | None = Field(
        default=None,
        ge=1,
        le=2,
    )

    accelX: float | None = Field(
        default=None,
        ge=0,
    )

    hp: int | None = Field(
        default=None,
        ge=0,
        le=100,
    )

    timeLeft: int | None = Field(
        default=None,
        ge=0,
    )

    reason: str | None = None

    hpP1: int | None = Field(
        default=None,
        ge=0,
        le=100,
    )

    hpP2: int | None = Field(
        default=None,
        ge=0,
        le=100,
    )


class MatchStatusResponse(BaseModel):
    current_round: int
    is_active: bool
    time_left: int

    player1_hp: int
    player2_hp: int

    player1_total_punches: int
    player2_total_punches: int

    player1_strong_hits: int
    player2_strong_hits: int

    logs: list[str]