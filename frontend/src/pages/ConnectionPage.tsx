import {
  useMemo,
  useState,
  type ReactNode,
} from "react";

import heroImage from "../assets/hero.png";
import hero2Image from "../assets/hero2.png";
import RobotMotion from "../components/RobotMotion";

type ConnectionPageProps = {
  onConnected: () => void;
};

type ConnectionStatus =
  | "disconnected"
  | "connecting"
  | "connected";

type PlayerConnectionCardProps = {
  playerLabel: string;
  playerName: string;
  deviceId: string;
  imageSrc: string;
  /** 指定するとキャラ画像の代わりにこれを表示(RobotMotion用) */
  character?: ReactNode;
  accentColor: "blue" | "red";
  status: ConnectionStatus;
  onConnect: () => void;
};

const STATUS_LABELS: Record<ConnectionStatus, string> = {
  disconnected: "未接続",
  connecting: "接続中",
  connected: "接続完了",
};

function PlayerConnectionCard({
  playerLabel,
  playerName,
  deviceId,
  imageSrc,
  character,
  accentColor,
  status,
  onConnect,
}: PlayerConnectionCardProps) {
  const isConnected = status === "connected";
  const isConnecting = status === "connecting";

  return (
    <article
      className={[
        "connection-player-card",
        `connection-player-card--${accentColor}`,
        isConnected
          ? "connection-player-card--connected"
          : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <div className="connection-player-card__header">
        <div>
          <p className="connection-player-card__label">
            {playerLabel}
          </p>

          <h2 className="connection-player-card__name">
            {playerName}
          </h2>
        </div>

        <span
          className={[
            "connection-status-badge",
            `connection-status-badge--${status}`,
          ].join(" ")}
        >
          <span
            className="connection-status-badge__dot"
            aria-hidden="true"
          />

          {STATUS_LABELS[status]}
        </span>
      </div>

      <div className="connection-player-card__visual">
        <div
          className="connection-player-card__glow"
          aria-hidden="true"
        />

        {character ?? (
          <img
            src={imageSrc}
            alt={`${playerName}のキャラクター`}
            className="connection-player-card__character"
          />
        )}
      </div>

      <dl className="connection-device-info">
        <div className="connection-device-info__row">
          <dt>デバイスID</dt>
          <dd>{deviceId}</dd>
        </div>

        <div className="connection-device-info__row">
          <dt>接続方式</dt>
          <dd>Wi-Fi</dd>
        </div>

        <div className="connection-device-info__row">
          <dt>ステータス</dt>
          <dd>{STATUS_LABELS[status]}</dd>
        </div>
      </dl>

      <button
        type="button"
        className={[
          "connection-player-card__button",
          `connection-player-card__button--${accentColor}`,
        ].join(" ")}
        onClick={onConnect}
        disabled={isConnected || isConnecting}
      >
        {isConnected
          ? "接続済み"
          : isConnecting
            ? "接続しています..."
            : `${deviceId}を接続`}
      </button>
    </article>
  );
}

export default function ConnectionPage({
  onConnected,
}: ConnectionPageProps) {
  const [glove1Status, setGlove1Status] =
    useState<ConnectionStatus>("disconnected");

  const [glove2Status, setGlove2Status] =
    useState<ConnectionStatus>("disconnected");

  const allConnected = useMemo(
    () =>
      glove1Status === "connected" &&
      glove2Status === "connected",
    [glove1Status, glove2Status],
  );

  const connectDevice = (
    device: "glove_1" | "glove_2",
  ) => {
    const setStatus =
      device === "glove_1"
        ? setGlove1Status
        : setGlove2Status;

    setStatus("connecting");

    window.setTimeout(() => {
      setStatus("connected");
    }, 900);
  };

  const startDemoMode = () => {
    setGlove1Status("connected");
    setGlove2Status("connected");

    window.setTimeout(() => {
      onConnected();
    }, 300);
  };

  return (
    <main className="connection-page">
      <section className="connection-page__container">
        <header className="connection-page__header">
          <div>
            <p className="connection-page__eyebrow">
              DEVICE CONNECTION
            </p>

            <h1 className="connection-page__title">
              グローブ接続
            </h1>

            <p className="connection-page__description">
              両プレイヤーのIoTグローブを接続してください。
            </p>
          </div>

          <div className="connection-page__step">
            <span>STEP</span>
            <strong>1 / 4</strong>
          </div>
        </header>

        <section className="connection-page__players">
          <PlayerConnectionCard
            playerLabel="PLAYER 1"
            playerName="playerA"
            deviceId="glove_1"
            imageSrc={heroImage}
            character={
              <RobotMotion mode="relax" width={220} />
            }
            accentColor="blue"
            status={glove1Status}
            onConnect={() => {
              connectDevice("glove_1");
            }}
          />

          <div
            className="connection-page__versus"
            aria-hidden="true"
          >
            <span>VS</span>
          </div>

          <PlayerConnectionCard
            playerLabel="PLAYER 2"
            playerName="playerB"
            deviceId="glove_2"
            imageSrc={hero2Image}
            character={
              <RobotMotion mode="relax" width={220} />
            }
            accentColor="red"
            status={glove2Status}
            onConnect={() => {
              connectDevice("glove_2");
            }}
          />
        </section>

        <section
          className={[
            "connection-ready-panel",
            allConnected
              ? "connection-ready-panel--complete"
              : "",
          ]
            .filter(Boolean)
            .join(" ")}
        >
          <div className="connection-ready-panel__message">
            <span
              className="connection-ready-panel__icon"
              aria-hidden="true"
            >
              {allConnected ? "✓" : "⌁"}
            </span>

            <div>
              <strong>
                {allConnected
                  ? "両プレイヤーの接続が完了しました"
                  : "両方のグローブを接続してください"}
              </strong>

              <span>
                {allConnected
                  ? "試合画面へ進む準備ができています"
                  : "接続が完了すると試合を開始できます"}
              </span>
            </div>
          </div>

          <div className="connection-page__actions">
            <button
              type="button"
              className="connection-ready-panel__button"
              onClick={onConnected}
              disabled={!allConnected}
            >
              試合画面へ進む
              <span aria-hidden="true">→</span>
            </button>

            <button
              type="button"
              className="connection-page__demo-button"
              onClick={startDemoMode}
            >
              デモモードで確認
            </button>
          </div>
        </section>

        <footer className="connection-page__footer">
          <span>
            COMMUNICATOR STATUS: ONLINE
          </span>

          <span>
            接続対象: glove_1 / glove_2
          </span>
        </footer>
      </section>
    </main>
  );
}