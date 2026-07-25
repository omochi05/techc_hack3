# TECHC_HACK3

## プロジェクト概要

### IoTボクシング対戦システム

ESP32や各種センサーを搭載したボクシンググローブから、パンチや心拍数などのデータを取得し、試合状況をWeb画面上に表示するシステムです。

グローブ側で取得したセンサーデータをバックエンドへ送信し、試合・ラウンド情報と関連付けてデータベースへ保存します。

保存されたデータはフロントエンドから取得し、選手ごとのパンチ速度、衝撃値、心拍数などの表示に利用します。

---

## システム構成

```text
グローブ側ESP32
    ↓
ESP-NOW
    ↓
中央ESP32
    ↓
HTTP通信またはPC経由
    ↓
FastAPI
    ↓
MySQL
    ↓
React
各担当
担当	主な作業
フロントエンド	試合画面、操作画面、センサーデータの表示
バックエンド	API、試合管理、ラウンド管理、データ保存
IoT	ESP32、センサー、ESP-NOW、グローブ筐体

IoT機器からバックエンドへの送信方法やデータ形式は、現在調整中です。

主な機能
試合管理
試合の作成
試合情報の取得
試合の開始
ラウンドの開始
ラウンドの終了
センサーデータ管理
IoT機器からのセンサーデータ受信
デバイスIDによる選手判定
試合・ラウンドとの関連付け
MySQLへのデータ保存
不正な試合ID、ラウンドID、デバイスIDの検証
フロントエンド連携
試合情報の取得
ラウンド状態の取得
センサーデータの取得・表示
試合操作APIの呼び出し
使用技術
フロントエンド
React
TypeScript
Vite
バックエンド
Python
FastAPI
SQLAlchemy
PyMySQL
Uvicorn
python-dotenv
データベース
MySQL
IoT
ESP32
C++
ESP-NOW
各種センサー
3Dプリンター
開発管理
Git
GitHub
フォルダー構成
TECHC_HACK3/
├── backend/
│   ├── models/
│   │   ├── match.py
│   │   ├── round.py
│   │   └── sensor_record.py
│   │
│   ├── schemas/
│   │   ├── match.py
│   │   ├── round.py
│   │   └── sensor_record.py
│   │
│   ├── routers/
│   │   ├── matches.py
│   │   └── sensor_records.py
│   │
│   ├── services/
│   │   ├── match_service.py
│   │   └── sensor_record_service.py
│   │
│   ├── database.py
│   ├── main.py
│   ├── requirements.txt
│   ├── .env
│   └── .venv/
│
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── assets/
│   │   ├── components/
│   │   ├── App.css
│   │   ├── App.tsx
│   │   ├── index.css
│   │   └── main.tsx
│   │
│   ├── .gitignore
│   ├── index.html
│   ├── package.json
│   ├── package-lock.json
│   ├── tsconfig.json
│   ├── tsconfig.app.json
│   ├── tsconfig.node.json
│   └── vite.config.ts
│
├── .gitignore
└── README.md

実際のファイル構成に合わせて、存在しないファイルは削除してください。

バックエンドの構成
backend/main.py

FastAPIアプリケーションの起点となるファイルです。

主に以下の処理を行います。

FastAPIアプリケーションの作成
CORS設定
APIルーターの登録
データベーステーブルの作成
動作確認用エンドポイントの定義
backend/database.py

MySQLへの接続設定を管理します。

主に以下を定義します。

データベース接続エンジン
SQLAlchemyセッション
モデルの基底クラス
APIで使用するDBセッション
backend/models

SQLAlchemyを使用したデータベースモデルを管理します。

主なモデルは以下です。

試合モデル
ラウンドモデル
センサーデータモデル
backend/schemas

Pydanticを使用したAPIのリクエスト・レスポンス形式を管理します。

backend/routers

URLやHTTPメソッドなど、APIのエンドポイントを管理します。

backend/services

試合作成、ラウンド管理、センサーデータ保存などの処理を管理します。

ルーターから業務処理を分離することで、コードを整理しています。

API一覧
試合を作成する
POST /api/matches
試合情報を取得する
GET /api/matches/{match_id}
試合を開始する
POST /api/matches/{match_id}/start
ラウンドを開始する
POST /api/matches/{match_id}/rounds/start
ラウンドを終了する
POST /api/matches/{match_id}/rounds/{round_id}/finish
センサーデータを送信する
POST /api/matches/{match_id}/rounds/{round_id}/sensor-data
センサーデータ送信形式

現在は、以下のJSON形式を仮仕様として使用しています。

{
  "device_id": "glove_1",
  "heart_rate": 145,
  "punch_speed": 8.7,
  "impact_value": 72.4
}
項目
項目	型	説明
device_id	string	データを送信した機器の識別子
heart_rate	integer	心拍数
punch_speed	number	パンチ速度
impact_value	number	衝撃値
デバイスと選手の対応

現在は以下の対応を仮定しています。

glove_1 → player1
glove_2 → player2

試合に登録された選手名へ、バックエンド側で変換します。

device_id
    ↓
player1 または player2
    ↓
試合に登録された選手名

デバイスIDや送信項目は、IoT側の実装に合わせて変更する可能性があります。

開発を始める準備
1. リポジトリをクローンする
git clone https://github.com/omochi05/techc-hackthon.git
2. プロジェクトフォルダーへ移動する
cd techc-hackthon
3. mainブランチへ移動する
git switch main
4. 最新の変更を取得する
git pull origin main
フロントエンドの起動方法
1. frontendフォルダーへ移動する
cd frontend
2. ライブラリをインストールする

初回のみ実行します。

npm install
3. Reactを起動する
npm run dev

起動後、ターミナルに表示されたURLへアクセスします。

http://localhost:5173
4. Reactを停止する
Ctrl + C
バックエンドの起動方法
1. backendフォルダーへ移動する
cd backend
2. Python仮想環境を作成する

初回のみ実行します。

python -m venv .venv
3. 仮想環境を有効化する
Windows Git Bash
source .venv/Scripts/activate
Windows コマンドプロンプト
.venv\Scripts\activate
Windows PowerShell
.venv\Scripts\Activate.ps1
4. ライブラリをインストールする
pip install -r requirements.txt
5. 環境変数を設定する

backend/.envを作成します。

DATABASE_URL=mysql+pymysql://root:パスワード@localhost:3306/techc_hack3

例：

DATABASE_URL=mysql+pymysql://root:password@localhost:3306/techc_hack3

.envにはパスワードが含まれるため、GitHubにはプッシュしません。

6. MySQLにデータベースを作成する
CREATE DATABASE techc_hack3
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;
7. FastAPIを起動する

backendフォルダー内で実行します。

uvicorn main:app --reload
8. 動作を確認する

FastAPI：

http://127.0.0.1:8000

Swagger UI：

http://127.0.0.1:8000/docs
9. FastAPIを停止する
Ctrl + C
10. 仮想環境を終了する
deactivate
requirements.txt

バックエンドでは、最低限以下のライブラリを使用します。

fastapi
uvicorn
sqlalchemy
pymysql
python-dotenv

使用中の環境から依存関係を保存する場合は、以下を実行します。

pip freeze > requirements.txt
Gitを使用した開発手順

開発では、原則としてmainブランチを直接編集しません。

作業ごとにブランチを作成し、Pull Requestを通してmainへ取り込みます。

1. mainブランチへ移動する
git switch main
2. mainブランチを最新にする
git pull origin main
3. 作業用ブランチを作成する
git switch -c 種類_タスクID-作業内容

例：

git switch -c feat_021-sensor-data-api
4. 現在のブランチを確認する
git branch
5. ファイルを編集する

担当する機能を実装します。

6. 変更内容を確認する
git status
git diff
7. 必要なファイルをステージングする
git add ファイル名

例：

git add backend/models/sensor_record.py
git add backend/schemas/sensor_record.py
git add backend/services/sensor_record_service.py

すべて追加する場合：

git add .

.venv、node_modules、__pycache__、.envなどが含まれていないことを確認してください。

8. コミットする
git commit -m "種類: 変更内容"

例：

git commit -m "feat: add sensor data API"
9. GitHubへプッシュする

初回：

git push -u origin ブランチ名

2回目以降：

git push
10. Pull Requestを作成する

GitHub上で、作業ブランチからmainブランチへのPull Requestを作成します。

作業ブランチ
    ↓
Pull Request
    ↓
main
ブランチの命名ルール
種類_タスクID-作業内容

例：

feat_021-sensor-data-api
feat_022-iot-receive-api
fix_023-sensor-validation
docs_024-update-readme
種類	用途
feat	新しい機能
fix	不具合修正
docs	ドキュメント修正
refactor	動作を変えないコード整理
test	テストの追加・修正
chore	設定や環境構築
コミットメッセージのルール
種類: 変更内容

例：

feat: add match management API
feat: add sensor data API
fix: validate active round
docs: update README
refactor: separate sensor service
.gitignore

最低限、以下のファイルやフォルダーはGitHubへプッシュしません。

# Python
backend/.venv/
backend/__pycache__/
backend/**/__pycache__/
*.pyc

# Environment variables
backend/.env
.env

# Node.js
frontend/node_modules/
node_modules/

# Build
frontend/dist/

# Editor
.vscode/
.idea/

# OS
.DS_Store
Thumbs.db
開発時の注意事項
mainブランチで直接開発しない
作業前にmainを最新の状態にする
1つのブランチでは1つのタスクを行う
関係のないファイルを一緒にコミットしない
.venv、.env、node_modulesをプッシュしない
__pycache__や.pycをコミットしない
他の担当者のコードを削除する前に確認する
APIの変更時はフロント・IoT担当へ共有する
エラー文は省略せず共有する
Pull Requestで変更内容を確認してからマージする
実機接続前にSwaggerやダミーデータでAPIを確認する
今後の実装予定
IoT担当との送信形式の確定
中央ESP32からバックエンドへの接続
センサーデータ取得API
フロントエンドへのリアルタイム表示
試合結果の集計
勝敗判定
実機を使用した通しテスト
エラー処理の改善
現在の開発状況
完了
 FastAPI環境構築
 MySQL接続
 試合作成API
 試合情報取得API
 試合開始API
 ラウンド開始API
 ラウンド終了API
 センサーデータ受信API
 センサーデータのDB保存
 デバイスIDによる選手判定
 Swaggerでの動作確認
対応中
 IoT側の送信仕様確認
 IoT実機との接続
 フロントエンドとの結合
 センサーデータ取得・表示
 試合全体の通しテスト