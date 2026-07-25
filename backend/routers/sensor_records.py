from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from database import get_db
from schemas.sensor_record import (
    SensorRecordCreate,
    SensorRecordResponse,
)
from services.sensor_record_service import (
    create_sensor_record,
    get_sensor_records,
)


router = APIRouter(
    prefix="/api/matches",
    tags=["sensor-records"],
)


@router.post(
    "/{match_id}/rounds/{round_id}/sensor-data",
    response_model=SensorRecordResponse,
    status_code=201,
)
def create_sensor_record_endpoint(
    match_id: int,
    round_id: int,
    sensor_data: SensorRecordCreate,
    db: Session = Depends(get_db),
) -> SensorRecordResponse:
    return create_sensor_record(
        db=db,
        match_id=match_id,
        round_id=round_id,
        sensor_data=sensor_data,
    )


@router.get(
    "/{match_id}/rounds/{round_id}/sensor-data",
    response_model=list[SensorRecordResponse],
)
def get_sensor_records_endpoint(
    match_id: int,
    round_id: int,
    db: Session = Depends(get_db),
) -> list[SensorRecordResponse]:
    return get_sensor_records(
        db=db,
        match_id=match_id,
        round_id=round_id,
    )