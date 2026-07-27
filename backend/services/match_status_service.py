from copy import deepcopy
from datetime import datetime
from typing import Any


class MatchStatusService:
    def __init__(self) -> None:
        self._status: dict[str, Any] = {
            "current_round": 1,
            "is_active": False,
            "time_left": 45,
            "player1": {
                "hp": 100,
                "total_punches": 0,
                "strong_hits": 0,
            },
            "player2": {
                "hp": 100,
                "total_punches": 0,
                "strong_hits": 0,
            },
            "logs": [],
        }

    def handle_event(
        self,
        event: dict[str, Any],
    ) -> None:
        event_type = event.get("type")

        if event_type == "punch":
            self._handle_punch(event)
        elif event_type == "timer":
            self._handle_timer(event)
        elif event_type == "round_start":
            self._handle_round_start(event)
        elif event_type == "round_end":
            self._handle_round_end(event)
        else:
            raise ValueError(
                f"未対応のイベントです: {event_type}",
            )

    def _handle_punch(
        self,
        event: dict[str, Any],
    ) -> None:
        player_id = event.get("playerId")
        accel_x = event.get("accelX")
        hp = event.get("hp")
        round_number = event.get("round")

        if player_id not in (1, 2):
            raise ValueError(
                f"playerIdが不正です: {player_id}",
            )

        player_key = f"player{player_id}"
        player_status = self._status[player_key]

        player_status["total_punches"] += 1

        if isinstance(accel_x, (int, float)):
            if accel_x > 8.0:
                player_status["strong_hits"] += 1

        if isinstance(hp, int):
            player_status["hp"] = hp

        if isinstance(round_number, int):
            self._status["current_round"] = round_number

        timestamp = datetime.now().strftime(
            "%H:%M:%S",
        )

        log_message = (
            f"[{timestamp}] "
            f"Round {round_number} | "
            f"P{player_id} Punch "
            f"({accel_x} m/s²) | "
            f"HP: {hp}%"
        )

        self._status["logs"].append(
            log_message,
        )

    def _handle_timer(
        self,
        event: dict[str, Any],
    ) -> None:
        time_left = event.get("timeLeft")

        if isinstance(time_left, int):
            self._status["time_left"] = time_left

    def _handle_round_start(
        self,
        event: dict[str, Any],
    ) -> None:
        round_number = event.get("round")

        self._status["is_active"] = True

        if isinstance(round_number, int):
            self._status["current_round"] = round_number

    def _handle_round_end(
        self,
        event: dict[str, Any],
    ) -> None:
        round_number = event.get("round")
        hp_p1 = event.get("hpP1")
        hp_p2 = event.get("hpP2")
        reason = event.get("reason")

        self._status["is_active"] = False

        if isinstance(round_number, int):
            self._status["current_round"] = round_number

        if isinstance(hp_p1, int):
            self._status["player1"]["hp"] = hp_p1

        if isinstance(hp_p2, int):
            self._status["player2"]["hp"] = hp_p2

        timestamp = datetime.now().strftime(
            "%H:%M:%S",
        )

        log_message = (
            f"[{timestamp}] "
            f"Round {round_number} End | "
            f"P1 HP: {hp_p1}% | "
            f"P2 HP: {hp_p2}% | "
            f"Reason: {reason}"
        )

        self._status["logs"].append(
            log_message,
        )

    def get_status(self) -> dict[str, Any]:
        return {
            "current_round": self._status[
                "current_round"
            ],
            "is_active": self._status[
                "is_active"
            ],
            "time_left": self._status[
                "time_left"
            ],
            "player1_hp": self._status[
                "player1"
            ]["hp"],
            "player2_hp": self._status[
                "player2"
            ]["hp"],
            "player1_total_punches": self._status[
                "player1"
            ]["total_punches"],
            "player2_total_punches": self._status[
                "player2"
            ]["total_punches"],
            "player1_strong_hits": self._status[
                "player1"
            ]["strong_hits"],
            "player2_strong_hits": self._status[
                "player2"
            ]["strong_hits"],
            "logs": deepcopy(
                self._status["logs"],
            ),
        }


match_status_service = MatchStatusService()