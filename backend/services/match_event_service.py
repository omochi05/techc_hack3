from datetime import datetime, timezone
from threading import Lock

from schemas.match import MatchPlayer, PunchResponse


class MatchEventService:
    def __init__(self) -> None:
        self._latest_punch: PunchResponse | None = None
        self._next_id = 1
        self._lock = Lock()

    def save_punch(
        self,
        player: MatchPlayer,
        power: float,
    ) -> PunchResponse:
        with self._lock:
            punch = PunchResponse(
                id=self._next_id,
                player=player,
                power=power,
                timestamp=datetime.now(timezone.utc),
            )

            self._latest_punch = punch
            self._next_id += 1

            return punch

    def get_latest_punch(self) -> PunchResponse | None:
        with self._lock:
            return self._latest_punch


match_event_service = MatchEventService()