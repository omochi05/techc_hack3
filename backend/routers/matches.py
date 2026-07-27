from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from database import get_db
from schemas.match import (
    BoxingEventRequest,
    LatestPunchResponse,
    MatchCreate,
    MatchResponse,
    MatchStatusResponse,
    PunchCreateRequest,
    PunchResponse,
)
from schemas.round import (
    RoundFinishRequest,
    RoundResponse,
)
from services.match_event_service import (
    match_event_service,
)
from services.match_service import (
    create_match,
    finish_round,
    get_match,
    start_match,
    start_round,
)
from services.match_status_service import (
    match_status_service,
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
) -> MatchResponse:
    return create_match(
        db,
        data,
    )


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


@router.post(
    "/boxing-event",
    status_code=status.HTTP_200_OK,
)
def handle_boxing_event_endpoint(
    event: BoxingEventRequest,
) -> dict[str, str]:
    event_data = event.model_dump(
        exclude_none=True,
    )

    print(
        "📥 受信イベント:",
        event_data,
    )

    match_status_service.handle_event(
        event_data,
    )

    current_status = (
        match_status_service.get_status()
    )

    print(
        "✅ 更新後ステータス:",
        current_status,
    )

    return {
        "status": "success",
        "event_type": event.type,
    }


@router.get(
    "/match-status",
    response_model=MatchStatusResponse,
)
def get_match_status_endpoint() -> MatchStatusResponse:
    current_status = (
        match_status_service.get_status()
    )

    print(
        "📤 取得ステータス:",
        current_status,
    )

    return MatchStatusResponse(
        **current_status,
    )


@router.get(
    "/{match_id}",
    response_model=MatchResponse,
)
def get_match_endpoint(
    match_id: int,
    db: Session = Depends(get_db),
) -> MatchResponse:
    return get_match(
        db,
        match_id,
    )


@router.post(
    "/{match_id}/start",
    response_model=MatchResponse,
)
def start_match_endpoint(
    match_id: int,
    db: Session = Depends(get_db),
) -> MatchResponse:
    return start_match(
        db,
        match_id,
    )


@router.post(
    "/{match_id}/rounds/start",
    response_model=RoundResponse,
    status_code=status.HTTP_201_CREATED,
)
def start_round_endpoint(
    match_id: int,
    db: Session = Depends(get_db),
) -> RoundResponse:
    return start_round(
        db,
        match_id,
    )


@router.post(
    "/{match_id}/rounds/{round_id}/finish",
    response_model=RoundResponse,
)
def finish_round_endpoint(
    match_id: int,
    round_id: int,
    data: RoundFinishRequest,
    db: Session = Depends(get_db),
) -> RoundResponse:
    return finish_round(
        db=db,
        match_id=match_id,
        round_id=round_id,
        winner_name=data.winner_name,
    )