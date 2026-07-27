from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from database import get_db
from schemas.match import (
    LatestPunchResponse,
    MatchCreate,
    MatchResponse,
    PunchCreateRequest,
    PunchResponse,
)
from schemas.round import RoundFinishRequest, RoundResponse
from services.match_event_service import match_event_service
from services.match_service import (
    create_match,
    finish_round,
    get_match,
    start_match,
    start_round,
)

router = APIRouter(
    prefix="/api/matches",
    tags=["matches"],
)


@router.post(
    "",
    response_model=MatchResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_match_endpoint(
    data: MatchCreate,
    db: Session = Depends(get_db),
):
    return create_match(db, data)


@router.post(
    "/punch",
    response_model=PunchResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_punch_endpoint(
    data: PunchCreateRequest,
) -> PunchResponse:
    return match_event_service.save_punch(
        player=data.player,
        power=data.power,
    )


@router.get(
    "/latest-punch",
    response_model=LatestPunchResponse,
)
def get_latest_punch_endpoint() -> LatestPunchResponse:
    return LatestPunchResponse(
        punch=match_event_service.get_latest_punch(),
    )


@router.get(
    "/{match_id}",
    response_model=MatchResponse,
)
def get_match_endpoint(
    match_id: int,
    db: Session = Depends(get_db),
):
    return get_match(db, match_id)


@router.post(
    "/{match_id}/start",
    response_model=MatchResponse,
)
def start_match_endpoint(
    match_id: int,
    db: Session = Depends(get_db),
):
    return start_match(db, match_id)


@router.post(
    "/{match_id}/rounds/start",
    response_model=RoundResponse,
    status_code=status.HTTP_201_CREATED,
)
def start_round_endpoint(
    match_id: int,
    db: Session = Depends(get_db),
):
    return start_round(db, match_id)


@router.post(
    "/{match_id}/rounds/{round_id}/finish",
    response_model=RoundResponse,
)
def finish_round_endpoint(
    match_id: int,
    round_id: int,
    data: RoundFinishRequest,
    db: Session = Depends(get_db),
):
    return finish_round(
        db=db,
        match_id=match_id,
        round_id=round_id,
        winner_name=data.winner_name,
    )