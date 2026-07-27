from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


MatchPlayer = Literal["playerA", "playerB"]


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