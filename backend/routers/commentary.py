from fastapi import APIRouter

from schemas.commentary import (
    CommentaryRequest,
    CommentaryResponse,
)
from services.commentary_service import generate_commentary


router = APIRouter(
    prefix="/api/commentary",
    tags=["commentary"],
)


@router.post(
    "/generate",
    response_model=CommentaryResponse,
)
def create_commentary(
    request: CommentaryRequest,
) -> CommentaryResponse:
    commentary = generate_commentary(
        event_type=request.event_type,
        player=request.player,
        power=request.power,
        combo_count=request.combo_count,
        player1_hp=request.player1_hp,
        player2_hp=request.player2_hp,
        winner=request.winner,
    )

    return CommentaryResponse(
        commentary=commentary,
    )