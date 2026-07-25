import { useState } from "react";
import "./DeviceConnectButton.css";

type ConnectionStatus =
  | "DISCONNECTED"
  | "CONNECTING"
  | "CONNECTED"
  | "ERROR";

type DeviceConnectButtonProps = {
  deviceId: string;
  initialStatus?: ConnectionStatus;
};

const STATUS_LABELS: Record<ConnectionStatus, string> = {
  DISCONNECTED: "未接続",
  CONNECTING: "接続中",
  CONNECTED: "接続済み",
  ERROR: "接続エラー",
};

export default function DeviceConnectButton({
  deviceId,
  initialStatus = "DISCONNECTED",
}: DeviceConnectButtonProps) {
  const [status, setStatus] =
    useState<ConnectionStatus>(initialStatus);

  const handleConnect = async () => {
    if (status === "CONNECTING") {
      return;
    }

    try {
      setStatus("CONNECTING");

      // Task 025では仮の接続処理
      await new Promise((resolve) => {
        window.setTimeout(resolve, 1000);
      });

      setStatus("CONNECTED");
    } catch (error) {
      console.error("Device connection error:", error);
      setStatus("ERROR");
    }
  };

  const buttonLabel =
    status === "CONNECTING"
      ? "接続中..."
      : status === "CONNECTED"
        ? "再接続"
        : "機器に接続";

  return (
    <div className="device-connect">
      <div className="device-connect__info">
        <span className="device-connect__id">
          グローブID: {deviceId}
        </span>

        <span
          className={`device-connect__status device-connect__status--${status.toLowerCase()}`}
        >
          <span className="device-connect__status-dot" />
          {STATUS_LABELS[status]}
        </span>
      </div>

      <button
        type="button"
        className="device-connect__button"
        onClick={handleConnect}
        disabled={status === "CONNECTING"}
      >
        {buttonLabel}
      </button>
    </div>
  );
}