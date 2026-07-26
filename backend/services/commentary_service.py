from typing import Literal


EventType = Literal[
    "match_start",
    "punch",
    "strong_punch",
    "combo",
    "low_health",
    "knockdown",
    "match_end",
]


def generate_commentary(
    event_type: EventType,
    player: str | None = None,
    power: int | None = None,
    combo_count: int | None = None,
    player1_hp: int | None = None,
    player2_hp: int | None = None,
    winner: str | None = None,
) -> str:
    player_name = format_player_name(player)

    if event_type == "match_start":
        return "両者準備完了！ロボットボクシング、試合開始です！"

    if event_type == "punch":
        return f"{player_name}のパンチが決まった！"

    if event_type == "strong_punch":
        if power is not None:
            return (
                f"{player_name}の強烈な一撃！"
                f"威力は{power}、大きなダメージです！"
            )

        return f"{player_name}の強烈な一撃！大きなダメージです！"

    if event_type == "combo":
        if combo_count is not None:
            return (
                f"{player_name}が{combo_count}連続コンボ！"
                "相手を一気に追い込みます！"
            )

        return f"{player_name}の連続攻撃！相手を追い込みます！"

    if event_type == "low_health":
        low_health_player = get_low_health_player(
            player1_hp=player1_hp,
            player2_hp=player2_hp,
        )

        if low_health_player is not None:
            return (
                f"{low_health_player}の体力が残りわずか！"
                "ここが勝負どころです！"
            )

        return "どちらかの体力が危険な状態です！"

    if event_type == "knockdown":
        return f"{player_name}がダウン！立ち上がれるでしょうか！"

    if event_type == "match_end":
        winner_name = format_player_name(winner)

        if winner is not None:
            return f"試合終了！勝者は{winner_name}です！"

        return "試合終了！激しい戦いとなりました！"

    return "試合が動いています！"


def format_player_name(player: str | None) -> str:
    if player == "playerA":
        return "PLAYER 1"

    if player == "playerB":
        return "PLAYER 2"

    if player:
        return player

    return "プレイヤー"


def get_low_health_player(
    player1_hp: int | None,
    player2_hp: int | None,
) -> str | None:
    if player1_hp is not None and player1_hp <= 20:
        return "PLAYER 1"

    if player2_hp is not None and player2_hp <= 20:
        return "PLAYER 2"

    return None