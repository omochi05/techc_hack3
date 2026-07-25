import type {
  DeviceConnectRequest,
  DeviceConnectResponse,
  DeviceId,
} from "../types/device";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ??
  "http://localhost:8000";

export async function connectDevice(
  deviceId: DeviceId,
): Promise<DeviceConnectResponse> {
  const requestBody: DeviceConnectRequest = {
    device_id: deviceId,
  };

  const response = await fetch(
    `${API_BASE_URL}/api/devices/connect`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    },
  );

  if (!response.ok) {
    let errorMessage =
      "デバイスへの接続に失敗しました。";

    try {
      const errorData = await response.json();

      if (
        typeof errorData.detail === "string"
      ) {
        errorMessage = errorData.detail;
      }
    } catch {
      // JSON形式のエラーでない場合は
      // 初期メッセージを使用する
    }

    throw new Error(errorMessage);
  }

  return response.json() as Promise<DeviceConnectResponse>;
}