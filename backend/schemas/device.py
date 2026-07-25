from typing import Literal

from pydantic import BaseModel, Field


DeviceStatus = Literal[
    "DISCONNECTED",
    "PAIRING",
    "CONNECTED",
]


class DeviceRequest(BaseModel):
    device_id: str = Field(
        min_length=1,
        max_length=50,
    )


class DeviceConnectionResponse(BaseModel):
    device_id: str
    status: DeviceStatus
    message: str