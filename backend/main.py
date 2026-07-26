from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from sqlalchemy.orm import Session

from database import Base, engine, get_db
from routers.device import router as device_router
from routers.matches import router as matches_router
from routers.sensor_records import router as sensor_records_router
from routers.commentary import router as commentary_router

# SQLAlchemyモデルを読み込む
# create_allより先にimportする必要がある
import models.match
import models.round
import models.sensor_record


app = FastAPI(
    title="IoT Boxing API",
    version="1.0.0",
)

# デバイスAPI
app.include_router(device_router)

# モデルで定義したテーブルを作成
Base.metadata.create_all(bind=engine)

# React / Viteからのアクセスを許可
app.add_middleware(
    CORSMiddleware,
    allow_origins=[],
    allow_origin_regex=(
        r"^https?://"
        r"(localhost|127\.0\.0\.1)"
        r"(:\d+)?$"
    ),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ボクシング試合API
app.include_router(matches_router)
app.include_router(sensor_records_router)
app.include_router(commentary_router)

@app.get("/")
def root():
    return {
        "message": "IoT Boxing Backend is running",
        "version": "1.0.0",
    }


@app.get("/health")
def health_check():
    return {
        "status": "ok",
    }


@app.get("/api/db-check")
def db_check(
    db: Session = Depends(get_db),
):
    db.execute(text("SELECT 1"))

    return {
        "status": "success",
        "message": "データベースへの接続に成功しました",
    }


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "main:app",
        host="127.0.0.1",
        port=8000,
        reload=True,
    )