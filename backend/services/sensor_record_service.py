from fastapi import HTTPException
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from models.match import BoxingMatch
from models.round import BoxingRound
from models.sensor_record import SensorRecord
from schemas.sensor_record import SensorRecordCreate


DEVICE_PLAYER_MAP = {
    "glove_1": "player1",
    "glove_2": "player2",
}


def create_sensor_record(
    db: Session,
    match_id: int,
    round_id: int,
    sensor_data: SensorRecordCreate,
) -> SensorRecord:
    """
    進行中のラウンドへセンサーデータを登録する。
    """

    match = (
        db.query(BoxingMatch)
        .filter(BoxingMatch.id == match_id)
        .first()
    )

    if match is None:
        raise HTTPException(
            status_code=404,
            detail="試合が見つかりません。",
        )

    boxing_round = (
        db.query(BoxingRound)
        .filter(
            BoxingRound.id == round_id,
            BoxingRound.match_id == match_id,
        )
        .first()
    )

    if boxing_round is None:
        raise HTTPException(
            status_code=404,
            detail="ラウンドが見つかりません。",
        )

    if boxing_round.status != "ACTIVE":
        raise HTTPException(
            status_code=400,
            detail="進行中のラウンドにのみセンサーデータを登録できます。",
        )

    mapped_player = DEVICE_PLAYER_MAP.get(sensor_data.device_id)

    if mapped_player is None:
        raise HTTPException(
            status_code=400,
            detail="登録されていないデバイスIDです。",
        )

    match_player_map = {
        "player1": match.player1_name,
        "player2": match.player2_name,
    }

    player_name = match_player_map.get(mapped_player)

    if player_name is None:
        raise HTTPException(
            status_code=400,
            detail="デバイスに対応する選手が見つかりません。",
        )

    record = SensorRecord(
        match_id=match_id,
        round_id=round_id,
        device_id=sensor_data.device_id,
        player_name=player_name,
        heart_rate=sensor_data.heart_rate,
        punch_speed=sensor_data.punch_speed,
        impact_value=sensor_data.impact_value,
    )

    try:
        db.add(record)
        db.commit()
        db.refresh(record)

        return record

    except SQLAlchemyError as exc:
        db.rollback()

        print("SensorRecord save error:", repr(exc))

        raise HTTPException(
            status_code=500,
            detail="センサーデータの保存に失敗しました。",
        ) from exc


def get_sensor_records(
    db: Session,
    match_id: int,
    round_id: int,
) -> list[SensorRecord]:
    """
    指定された試合・ラウンドのセンサーデータを取得する。
    """

    match = (
        db.query(BoxingMatch)
        .filter(BoxingMatch.id == match_id)
        .first()
    )

    if match is None:
        raise HTTPException(
            status_code=404,
            detail="試合が見つかりません。",
        )

    boxing_round = (
        db.query(BoxingRound)
        .filter(
            BoxingRound.id == round_id,
            BoxingRound.match_id == match_id,
        )
        .first()
    )

    if boxing_round is None:
        raise HTTPException(
            status_code=404,
            detail="ラウンドが見つかりません。",
        )

    try:
        return (
            db.query(SensorRecord)
            .filter(
                SensorRecord.match_id == match_id,
                SensorRecord.round_id == round_id,
            )
            .order_by(
                SensorRecord.created_at.asc(),
                SensorRecord.id.asc(),
            )
            .all()
        )

    except SQLAlchemyError as exc:
        raise HTTPException(
            status_code=500,
            detail="センサーデータの取得に失敗しました。",
        ) from exc