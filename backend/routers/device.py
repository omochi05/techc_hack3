from fastapi import APIRouter, HTTPException, status

from schemas.device import (
    DeviceConnectionResponse,
    DeviceRequest,
)

from services.device_service import (
    connect_device,
    disconnect_device,
    get_device_status,
    start_pairing,
)


router = APIRouter(
    prefix="/api/devices",
    tags=["devices"],
)


@router.post(
    "/pairing-mode",
    response_model=DeviceConnectionResponse,
    status_code=status.HTTP_200_OK,
)
def enable_pairing_mode(
    request: DeviceRequest,
) -> DeviceConnectionResponse:
    """
    ESP32の接続ボタンが押された際に呼び出す。
    """
    start_pairing(request.device_id)

    return DeviceConnectionResponse(
        device_id=request.device_id,
        status="PAIRING",
        message=(
            "デバイスが接続待機状態になりました。"
            "30秒以内に接続してください。"
        ),
    )


@router.post(
    "/connect",
    response_model=DeviceConnectionResponse,
    status_code=status.HTTP_200_OK,
)
def connect(
    request: DeviceRequest,
) -> DeviceConnectionResponse:
    """
    Reactの接続ボタンから呼び出す。
    """
    if not connect_device(request.device_id):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=(
                "デバイスが接続待機状態ではありません。"
                "端末側の接続ボタンを押してください。"
            ),
        )

    return DeviceConnectionResponse(
        device_id=request.device_id,
        status="CONNECTED",
        message="デバイスに接続しました。",
    )


@router.get(
    "/{device_id}/status",
    response_model=DeviceConnectionResponse,
)
def get_status(
    device_id: str,
) -> DeviceConnectionResponse:
    device_status = get_device_status(device_id)

    message_map = {
        "DISCONNECTED": "デバイスは接続されていません。",
        "PAIRING": "デバイスは接続待機中です。",
        "CONNECTED": "デバイスは接続済みです。",
    }

    return DeviceConnectionResponse(
        device_id=device_id,
        status=device_status,
        message=message_map[device_status],
    )


@router.post(
    "/disconnect",
    response_model=DeviceConnectionResponse,
)
def disconnect(
    request: DeviceRequest,
) -> DeviceConnectionResponse:
    disconnect_device(request.device_id)

    return DeviceConnectionResponse(
        device_id=request.device_id,
        status="DISCONNECTED",
        message="デバイスの接続を解除しました。",
    )