from fastapi.testclient import TestClient

from main import app


client = TestClient(app)


def test_generate_strong_punch_commentary() -> None:
    response = client.post(
        "/api/commentary/generate",
        json={
            "event_type": "strong_punch",
            "player": "playerA",
            "power": 87,
            "player1_hp": 74,
            "player2_hp": 42,
        },
    )

    assert response.status_code == 200

    body = response.json()

    assert "commentary" in body
    assert "PLAYER 1" in body["commentary"]
    assert "87" in body["commentary"]


def test_generate_match_end_commentary() -> None:
    response = client.post(
        "/api/commentary/generate",
        json={
            "event_type": "match_end",
            "winner": "playerB",
        },
    )

    assert response.status_code == 200

    body = response.json()

    assert "PLAYER 2" in body["commentary"]
    assert "試合終了" in body["commentary"]


def test_reject_invalid_event_type() -> None:
    response = client.post(
        "/api/commentary/generate",
        json={
            "event_type": "invalid_event",
        },
    )

    assert response.status_code == 422