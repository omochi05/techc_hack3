from fastapi.testclient import TestClient

from main import app
from services.match_event_service import match_event_service


client = TestClient(app)


def setup_function() -> None:
    match_event_service._latest_punch = None
    match_event_service._next_id = 1


def test_create_punch() -> None:
    response = client.post(
        "/api/matches/punch",
        json={
            "player": "playerA",
            "power": 87,
        },
    )

    assert response.status_code == 201

    body = response.json()

    assert body["id"] == 1
    assert body["player"] == "playerA"
    assert body["power"] == 87
    assert "timestamp" in body


def test_get_latest_punch_before_creation() -> None:
    response = client.get(
        "/api/matches/latest-punch",
    )

    assert response.status_code == 200
    assert response.json() == {
        "punch": None,
    }


def test_get_latest_punch_after_creation() -> None:
    create_response = client.post(
        "/api/matches/punch",
        json={
            "player": "playerB",
            "power": 65,
        },
    )

    assert create_response.status_code == 201

    response = client.get(
        "/api/matches/latest-punch",
    )

    assert response.status_code == 200

    punch = response.json()["punch"]

    assert punch["id"] == 1
    assert punch["player"] == "playerB"
    assert punch["power"] == 65
    assert "timestamp" in punch


def test_latest_punch_is_updated() -> None:
    client.post(
        "/api/matches/punch",
        json={
            "player": "playerA",
            "power": 40,
        },
    )

    client.post(
        "/api/matches/punch",
        json={
            "player": "playerB",
            "power": 90,
        },
    )

    response = client.get(
        "/api/matches/latest-punch",
    )

    assert response.status_code == 200

    punch = response.json()["punch"]

    assert punch["id"] == 2
    assert punch["player"] == "playerB"
    assert punch["power"] == 90


def test_create_punch_rejects_invalid_player() -> None:
    response = client.post(
        "/api/matches/punch",
        json={
            "player": "playerC",
            "power": 87,
        },
    )

    assert response.status_code == 422


def test_create_punch_rejects_negative_power() -> None:
    response = client.post(
        "/api/matches/punch",
        json={
            "player": "playerA",
            "power": -1,
        },
    )

    assert response.status_code == 422