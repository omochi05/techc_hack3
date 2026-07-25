export type ConnectionStatus =
  | "DISCONNECTED"
  | "CONNECTING"
  | "CONNECTED"
  | "ERROR";

export type DeviceId =
  | "glove_1"
  | "glove_2";

export interface DeviceConnectRequest {
  device_id: DeviceId;
}

export interface DeviceConnectResponse {
  device_id: string;
  status: string;
  message?: string;
}