import json
import time
from typing import Any

import requests
import serial
from requests import Response
from serial import SerialException


# ==================================================
# 設定
# ==================================================

SERIAL_PORT = "COM6"
BAUD_RATE = 115200

MATCH_ID = 1
ROUND_ID = 1

FASTAPI_BASE_URL = "http://127.0.0.1:8000"

FASTAPI_URL = (
    f"{FASTAPI_BASE_URL}"
    f"/api/matches/{MATCH_ID}"
    f"/rounds/{ROUND_ID}"
    f"/sensor-data"
)

REQUEST_TIMEOUT = 2


# ==================================================
# 共通処理
# ==================================================

def clamp(
    value: float,
    minimum: float,
    maximum: float,
) -> float:
    """
    数値を指定範囲内に収める。
    """
    return max(
        minimum,
        min(value, maximum),
    )


def is_json_candidate(line: str) -> bool:
    """
    受信した文字列がJSONオブジェクトらしい形式か確認する。
    """
    stripped_line = line.strip()

    return (
        stripped_line.startswith("{")
        and stripped_line.endswith("}")
    )


# ==================================================
# FastAPI送信用データ作成
# ==================================================

def create_payload(
    player_num: int,
    accel_value: float,
    heart_rate: int = 130,
) -> dict[str, Any]:
    """
    ESP32から受信した値を、
    FastAPIのSensorRecordCreateに合う形式へ変換する。
    """

    punch_speed = round(
        clamp(
            accel_value * 0.8,
            0,
            100,
        ),
        1,
    )

    impact_value = round(
        clamp(
            accel_value,
            0,
            10000,
        ),
        2,
    )

    return {
        "device_id": f"glove_{player_num}",
        "heart_rate": int(
            clamp(
                heart_rate,
                30,
                250,
            )
        ),
        "punch_speed": punch_speed,
        "impact_value": impact_value,
    }


# ==================================================
# FastAPI送信処理
# ==================================================

def send_to_fastapi(
    payload: dict[str, Any],
) -> bool:
    """
    センサーデータをFastAPIへ送信する。
    """

    response: Response | None = None

    try:
        print(f"📤 FastAPIへ送信: {payload}")

        response = requests.post(
            FASTAPI_URL,
            json=payload,
            timeout=REQUEST_TIMEOUT,
        )

        print(
            f"📥 HTTP {response.status_code}: "
            f"{response.text}"
        )

        response.raise_for_status()

        print(
            "✅ FastAPIへのセンサーデータ登録に成功しました"
        )

        return True

    except requests.Timeout:
        print(
            "❌ FastAPIへの接続がタイムアウトしました"
        )

    except requests.ConnectionError:
        print(
            "❌ FastAPIへ接続できませんでした。"
        )
        print(
            "   バックエンドが起動しているか"
            "確認してください"
        )

    except requests.HTTPError as error:
        print(
            f"❌ FastAPIがエラーを返しました: {error}"
        )

        if response is not None:
            print(
                f"   HTTPステータス: "
                f"{response.status_code}"
            )
            print(
                f"   レスポンス: "
                f"{response.text}"
            )

    except requests.RequestException as error:
        print(
            "❌ FastAPIへの送信中に"
            f"エラーが発生しました: {error}"
        )

    return False


# ==================================================
# JSONデータ検証
# ==================================================

def get_player_num(
    data: dict[str, Any],
) -> int | None:
    """
    playerIdを取得して検証する。
    """

    player_num = data.get("playerId")

    if player_num is None:
        print(
            f"⚠️ playerIdがありません: {data}"
        )
        return None

    try:
        player_num_value = int(player_num)

    except (TypeError, ValueError):
        print(
            f"⚠️ playerIdが整数ではありません: "
            f"{player_num}"
        )
        return None

    if player_num_value not in (1, 2):
        print(
            "⚠️ playerIdは1または2である必要があります: "
            f"{player_num_value}"
        )
        return None

    return player_num_value


def get_accel_value(
    data: dict[str, Any],
) -> float | None:
    """
    accelXを取得して検証する。
    """

    accel = data.get("accelX")

    if accel is None:
        print(
            f"⚠️ accelXがありません: {data}"
        )
        return None

    try:
        return float(accel)

    except (TypeError, ValueError):
        print(
            f"⚠️ accelXが数値ではありません: {accel}"
        )
        return None


def get_heart_rate(
    data: dict[str, Any],
) -> int:
    """
    heartRateを取得して検証する。
    不正な場合は仮の値130を返す。
    """

    heart_rate_raw = data.get(
        "heartRate",
        130,
    )

    try:
        return int(heart_rate_raw)

    except (TypeError, ValueError):
        print(
            "⚠️ heartRateが数値ではないため、"
            "仮の値130を使用します"
        )

        return 130


# ==================================================
# シリアル受信処理
# ==================================================

def handle_serial_line(
    line: str,
) -> None:
    """
    ESP32から受信した1行を処理する。

    起動ログなどの通常文字列は無視し、
    JSON形式のパンチデータだけを処理する。
    """

    line = line.strip()

    if not line:
        return

    # ESP32の起動ログなど、JSONではない文字列
    if not is_json_candidate(line):
        print(f"ℹ️ ESP32ログ: {line}")
        return

    print(f"📥 ESP32 JSON受信: {line}")

    try:
        data = json.loads(line)

    except json.JSONDecodeError as error:
        print(
            f"⚠️ 不正なJSONデータです: {line}"
        )
        print(
            f"   JSON解析エラー: {error}"
        )
        return

    if not isinstance(data, dict):
        print(
            f"⚠️ JSONオブジェクトではありません: {data}"
        )
        return

    data_type = data.get("type")

    if data_type != "punch":
        print(
            "ℹ️ パンチ以外のデータを受信したため"
            f"無視します: {data}"
        )
        return

    player_num = get_player_num(data)

    if player_num is None:
        return

    accel_value = get_accel_value(data)

    if accel_value is None:
        return

    heart_rate = get_heart_rate(data)

    payload = create_payload(
        player_num=player_num,
        accel_value=accel_value,
        heart_rate=heart_rate,
    )

    send_to_fastapi(payload)


# ==================================================
# メイン処理
# ==================================================

def start_bridge() -> None:
    """
    ESP32中央ユニットへ接続し、
    グローブから受信したパンチデータを
    FastAPIへ中継する。
    """

    ser: serial.Serial | None = None

    try:
        ser = serial.Serial(
            port=SERIAL_PORT,
            baudrate=BAUD_RATE,
            timeout=1,
        )

    except SerialException as error:
        print(
            f"❌ ポート {SERIAL_PORT} に"
            f"接続できませんでした"
        )
        print(f"   詳細: {error}")
        print(
            "   Arduino IDEのシリアルモニターを"
            "閉じてください"
        )
        print(
            "   また、正しいCOMポートか"
            "確認してください"
        )
        return

    print(
        f"✅ ポート {SERIAL_PORT} で"
        "ESP32セントラルハブに接続しました"
    )
    print(
        f"🌐 FastAPI送信先: {FASTAPI_URL}"
    )
    print(
        "🚀 グローブからのパンチデータを"
        "待機しています"
    )
    print(
        "終了する場合は Ctrl+C を押してください"
    )

    try:
        # シリアル接続時にESP32が再起動する場合がある
        time.sleep(2)

        while True:
            if ser.in_waiting <= 0:
                time.sleep(0.01)
                continue

            try:
                raw_data = ser.readline()

                line = raw_data.decode(
                    "utf-8",
                    errors="ignore",
                ).strip()

            except SerialException as error:
                print(
                    "❌ シリアルデータの読み取りに"
                    f"失敗しました: {error}"
                )
                break

            except UnicodeDecodeError as error:
                print(
                    "⚠️ 受信データの文字コード変換に"
                    f"失敗しました: {error}"
                )
                continue

            if not line:
                continue

            handle_serial_line(line)

    except KeyboardInterrupt:
        print("\n🛑 bridge.pyを終了します")

    finally:
        if ser is not None and ser.is_open:
            ser.close()

        print(
            "🔌 シリアルポートを閉じました"
        )


if __name__ == "__main__":
    start_bridge()