import {
  useState,
} from "react";

import {
  connectDevice,
} from "../../api/deviceApi";

import type {
  ConnectionStatus,
  DeviceId,
} from "../../types/device";

import "./DeviceConnectButton.css";

interface DeviceConnectButtonProps {
  deviceId: DeviceId;
}

const STATUS_LABELS: Record<
  ConnectionStatus,
  string
> = {
  DISCONNECTED: "未接続",
  CONNECTING: "接続中",
  CONNECTED: "接続済み",
  ERROR: "接続エラー",
};

export function DeviceConnectButton({
  deviceId,
}: DeviceConnectButtonProps) {
  const [
    connectionStatus,
    setConnectionStatus,
  ] = useState<ConnectionStatus>(
    "DISCONNECTED",
  );

  const [
    errorMessage,
    setErrorMessage,
  ] = useState("");

  const handleConnect = async () => {
    if (
      connectionStatus === "CONNECTING" ||
      connectionStatus === "CONNECTED"
    ) {
      return;
    }

    setConnectionStatus("CONNECTING");
    setErrorMessage("");

    try {
      await connectDevice(deviceId);

      setConnectionStatus("CONNECTED");
    } catch (error) {
      setConnectionStatus("ERROR");

      if (error instanceof Error) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage(
          "予期しないエラーが発生しました。",
        );
      }
    }
  };

  const isConnecting =
    connectionStatus === "CONNECTING";

  const isConnected =
    connectionStatus === "CONNECTED";

  return (
    <div className="device-connect">
      <div className="device-connect__info">
        <span className="device-connect__label">
          DEVICE
        </span>

        <strong className="device-connect__id">
          {deviceId}
        </strong>
      </div>

      <div className="device-connect__status-area">
        <span
          className={[
            "device-connect__status",
            `device-connect__status--${connectionStatus.toLowerCase()}`,
          ].join(" ")}
        >
          {STATUS_LABELS[connectionStatus]}
        </span>

        <button
          type="button"
          className="device-connect__button"
          onClick={handleConnect}
          disabled={
            isConnecting ||
            isConnected
          }
        >
          {isConnecting
            ? "接続しています..."
            : isConnected
              ? "接続完了"
              : connectionStatus === "ERROR"
                ? "再接続"
                : "接続する"}
        </button>
      </div>

      {errorMessage && (
        <p
          className="device-connect__error"
          role="alert"
        >
          {errorMessage}
        </p>
      )}
    </div>
  );
}