import json
import time
from typing import Any

import requests
import serial


# ESP32の接続先
SERIAL_PORT = "COM3"
BAUD_RATE = 115200

# Task 042で作成したパンチ受信API
PUNCH_API_URL = "http://127.0.0.1:8000/api/matches/punch"

REQUEST_TIMEOUT = 5


def convert_player_id(player_id: int | None) -> str | None:
    """
    IoT側のplayerIdをフロントエンド側のプレイヤー名へ変換する。
    """

    if player_id == 1:
        return "playerA"

    if player_id == 2:
        return "playerB"

    return None


def create_punch_payload(data: dict[str, Any]) -> dict[str, Any] | None:
    """
    ESP32から受信したパンチデータを、
    FastAPIのパンチAPI用データへ変換する。
    """

    player_id = data.get("playerId")
    accel_x = data.get("accelX")

    if not isinstance(player_id, int):
        print(
            f"⚠️ playerIdが不正です: {player_id}",
        )
        return None

    player = convert_player_id(player_id)

    if player is None:
        print(
            f"⚠️ 未対応のplayerIdです: {player_id}",
        )
        return None

    if not isinstance(accel_x, (int, float)):
        print(
            f"⚠️ accelXが不正です: {accel_x}",
        )
        return None

    return {
        "player": player,
        "power": float(accel_x),
    }


def send_punch_event(data: dict[str, Any]) -> None:
    """
    変換したパンチデータをFastAPIへ送信する。
    """

    payload = create_punch_payload(data)

    if payload is None:
        return

    response = requests.post(
        PUNCH_API_URL,
        json=payload,
        timeout=REQUEST_TIMEOUT,
    )

    response.raise_for_status()

    print(
        f"📡 パンチ送信成功 [{response.status_code}] "
        f"{payload['player']} / power={payload['power']}",
    )


def handle_event(data: dict[str, Any]) -> None:
    """
    ESP32から受信したイベントを種類ごとに処理する。
    """

    event_type = data.get("type")

    if event_type == "punch":
        send_punch_event(data)
        return

    print(
        f"ℹ️ 未対応イベントを受信しました: {event_type}",
    )


def main() -> None:
    serial_connection: serial.Serial | None = None

    try:
        serial_connection = serial.Serial(
            SERIAL_PORT,
            BAUD_RATE,
            timeout=1,
        )

        print(
            f"✅ ESP32接続完了: {SERIAL_PORT}",
        )
        print(
            f"📡 API送信先: {PUNCH_API_URL}",
        )

        while True:
            if serial_connection.in_waiting <= 0:
                time.sleep(0.01)
                continue

            line = (
                serial_connection
                .readline()
                .decode(
                    "utf-8",
                    errors="ignore",
                )
                .strip()
            )

            if not line:
                continue

            print(
                f"📥 Serial受信: {line}",
            )

            try:
                data = json.loads(line)
            except json.JSONDecodeError:
                print(
                    f"⚠️ JSON解析エラー: {line}",
                )
                continue

            if not isinstance(data, dict):
                print(
                    f"⚠️ JSONオブジェクトではありません: {line}",
                )
                continue

            try:
                handle_event(data)
            except requests.RequestException as error:
                print(
                    f"❌ FastAPIへの送信に失敗しました: {error}",
                )

    except serial.SerialException as error:
        print(
            f"❌ シリアルポートを開けません: {error}",
        )

    except KeyboardInterrupt:
        print(
            "\n🛑 ブリッジスクリプトを停止します。",
        )

    finally:
        if (
            serial_connection is not None
            and serial_connection.is_open
        ):
            serial_connection.close()

            print(
                "🔌 シリアルポートを閉じました。",
            )


if __name__ == "__main__":
    main()