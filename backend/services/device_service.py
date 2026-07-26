from datetime import datetime, timedelta, timezone
from threading import Lock


PAIRING_TIMEOUT_SECONDS = 30

ALLOWED_DEVICE_IDS = {
    "glove_1",
    "glove_2",
}

_pairing_devices: dict[str, datetime] = {}
_connected_devices: set[str] = set()

_device_lock = Lock()


def is_allowed_device(device_id: str) -> bool:
    """
    接続を許可しているデバイスIDか判定する。
    """
    return device_id in ALLOWED_DEVICE_IDS


def start_pairing(device_id: str) -> None:
    """
    デバイスを接続待機状態にする。
    接続待機状態は30秒間有効。
    """
    now = datetime.now(timezone.utc)

    with _device_lock:
        _connected_devices.discard(device_id)
        _pairing_devices[device_id] = now


def _is_pairing_without_lock(
    device_id: str,
    now: datetime,
) -> bool:
    """
    ロック取得済みの状態で、
    デバイスが接続待機中か判定する。
    """
    started_at = _pairing_devices.get(device_id)

    if started_at is None:
        return False

    expires_at = started_at + timedelta(
        seconds=PAIRING_TIMEOUT_SECONDS,
    )

    if now >= expires_at:
        _pairing_devices.pop(device_id, None)
        return False

    return True


def is_pairing(device_id: str) -> bool:
    """
    デバイスが接続待機中か判定する。
    """
    now = datetime.now(timezone.utc)

    with _device_lock:
        return _is_pairing_without_lock(
            device_id,
            now,
        )


def connect_device(device_id: str) -> bool:
    """
    接続待機中のデバイスを接続済みにする。

    接続待機中でない場合はFalseを返す。
    """
    now = datetime.now(timezone.utc)

    with _device_lock:
        if not _is_pairing_without_lock(
            device_id,
            now,
        ):
            return False

        _pairing_devices.pop(device_id, None)
        _connected_devices.add(device_id)

        return True


def is_connected(device_id: str) -> bool:
    """
    デバイスが接続済みか判定する。
    """
    with _device_lock:
        return device_id in _connected_devices


def disconnect_device(device_id: str) -> None:
    """
    デバイスの接続待機状態と接続済み状態を解除する。
    """
    with _device_lock:
        _pairing_devices.pop(device_id, None)
        _connected_devices.discard(device_id)


def get_device_status(device_id: str) -> str:
    """
    デバイスの現在の接続状態を返す。
    """
    now = datetime.now(timezone.utc)

    with _device_lock:
        if device_id in _connected_devices:
            return "CONNECTED"

        if _is_pairing_without_lock(
            device_id,
            now,
        ):
            return "PAIRING"

        return "DISCONNECTED"