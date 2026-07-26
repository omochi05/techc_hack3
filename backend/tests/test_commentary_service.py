from services.commentary_service import generate_commentary

def test_match_start_commentary() -> None:
    commentary = generate_commentary(
        event_type="match_start",
    )

    assert "試合開始" in commentary


def test_strong_punch_commentary() -> None:
    commentary = generate_commentary(
        event_type="strong_punch",
        player="playerA",
        power=87,
    )

    assert "PLAYER 1" in commentary
    assert "87" in commentary


def test_combo_commentary() -> None:
    commentary = generate_commentary(
        event_type="combo",
        player="playerB",
        combo_count=4,
    )

    assert "PLAYER 2" in commentary
    assert "4連続コンボ" in commentary


def test_low_health_commentary() -> None:
    commentary = generate_commentary(
        event_type="low_health",
        player1_hp=18,
        player2_hp=65,
    )

    assert "PLAYER 1" in commentary
    assert "残りわずか" in commentary


def test_match_end_commentary() -> None:
    commentary = generate_commentary(
        event_type="match_end",
        winner="playerB",
    )

    assert "PLAYER 2" in commentary
    assert "試合終了" in commentary