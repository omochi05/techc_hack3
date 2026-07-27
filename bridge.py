import json
import time
from typing import Any

import requests
import serial


# ESP32の接続先
SERIAL_PORT = "COM3"
BAUD_RATE = 115200

# FastAPIの送信先
API_BASE_URL = "http://127.0.0.1:8000"

PUNCH_API_URL = (
    f"{API_BASE_URL}/api/matches/punch"
)

BOXING_EVENT_API_URL = (
    f"{API_BASE_URL}/api/matches/boxing-event"
)

REQUEST_TIMEOUT = 5

SUPPORTED_EVENT_TYPES = {
    "punch",
    "timer",
    "round_start",
    "round_end",
}


def convert_player_id(
    player_id: int | None,
) -> str | None:
    """
    IoT側のplayerIdを、
    FastAPI側のプレイヤー名へ変換する。
    """

    if player_id == 1:
        return "playerA"

    if player_id == 2:
        return "playerB"

    return None


def create_punch_payload(
    data: dict[str, Any],
) -> dict[str, Any] | None:
    """
    ESP32のパンチデータを、
    実況用パンチAPIの形式へ変換する。
    """

    player_id = data.get("playerId")
    accel_x = data.get("accelX")

    if not isinstance(player_id, int):
        print(
            f"⚠️ playerIdが不正です: {player_id}",
        )
        return None

    player = convert_player_id(
        player_id,
    )

    if player is None:
        print(
            f"⚠️ 未対応のplayerIdです: {player_id}",
        )
        return None

    if not isinstance(
        accel_x,
        (int, float),
    ):
        print(
            f"⚠️ accelXが不正です: {accel_x}",
        )
        return None

    return {
        "player": player,
        "power": float(accel_x),
    }


def send_boxing_event(
    data: dict[str, Any],
) -> None:
    """
    ESP32から受信した元データを、
    試合ステータス更新用APIへ送信する。
    """

    response = requests.post(
        BOXING_EVENT_API_URL,
        json=data,
        timeout=REQUEST_TIMEOUT,
    )

    response.raise_for_status()

    print(
        f"📊 試合イベント送信成功 "
        f"[{response.status_code}] "
        f"type={data.get('type')}",
    )


def send_punch_event(
    data: dict[str, Any],
) -> None:
    """
    パンチデータを実況用APIへ送信する。
    """

    payload = create_punch_payload(
        data,
    )

    if payload is None:
        return

    response = requests.post(
        PUNCH_API_URL,
        json=payload,
        timeout=REQUEST_TIMEOUT,
    )

    response.raise_for_status()

    print(
        f"🥊 パンチ送信成功 "
        f"[{response.status_code}] "
        f"{payload['player']} / "
        f"power={payload['power']}",
    )


def handle_event(
    data: dict[str, Any],
) -> None:
    """
    ESP32から受信したイベントを、
    種類ごとにFastAPIへ送信する。
    """

    event_type = data.get("type")

    if event_type not in SUPPORTED_EVENT_TYPES:
        print(
            f"ℹ️ 未対応イベントを受信しました: "
            f"{event_type}",
        )
        return

    # 全イベントを試合ステータス更新APIへ送信
    send_boxing_event(
        data,
    )

    # パンチだけ実況用APIにも送信
    if event_type == "punch":
        send_punch_event(
            data,
        )


def read_serial_json(
    serial_connection: serial.Serial,
) -> dict[str, Any] | None:
    """
    Serialから1行読み込み、
    JSONオブジェクトへ変換する。
    """

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
        return None

    print(
        f"📥 Serial受信: {line}",
    )

    try:
        data = json.loads(
            line,
        )
    except json.JSONDecodeError:
        print(
            f"⚠️ JSON解析エラー: {line}",
        )
        return None

    if not isinstance(data, dict):
        print(
            f"⚠️ JSONオブジェクトではありません: "
            f"{line}",
        )
        return None

    return data


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
            f"📊 試合イベント送信先: "
            f"{BOXING_EVENT_API_URL}",
        )
        print(
            f"🥊 パンチ送信先: "
            f"{PUNCH_API_URL}",
        )

        while True:
            if serial_connection.in_waiting <= 0:
                time.sleep(
                    0.01,
                )
                continue

            data = read_serial_json(
                serial_connection,
            )

            if data is None:
                continue

            try:
                handle_event(
                    data,
                )
            except requests.Timeout:
                print(
                    "❌ FastAPIへの送信が"
                    "タイムアウトしました。",
                )
            except requests.HTTPError as error:
                status_code = (
                    error.response.status_code
                    if error.response is not None
                    else "unknown"
                )

                response_text = (
                    error.response.text
                    if error.response is not None
                    else ""
                )

                print(
                    f"❌ FastAPIがエラーを返しました: "
                    f"status={status_code} "
                    f"response={response_text}",
                )
            except requests.ConnectionError:
                print(
                    "❌ FastAPIへ接続できません。"
                    "サーバーが起動しているか"
                    "確認してください。",
                )
            except requests.RequestException as error:
                print(
                    f"❌ FastAPIへの送信に失敗しました: "
                    f"{error}",
                )

    except serial.SerialException as error:
        print(
            f"❌ シリアルポートを開けません: "
            f"{error}",
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