import type {
  ActivityPayload,
  AnalysisResult,
  StatusCalculationResponse,
} from "../types/activity";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ??
  "http://127.0.0.1:8000";

export async function calculateStatus(
  payload: ActivityPayload,
): Promise<StatusCalculationResponse> {
  const response = await fetch(
    `${API_BASE_URL}/api/activity/calculate-status`,
    {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type":
          "application/json",
      },
      body: JSON.stringify(payload),
    },
  );

  if (!response.ok) {
    throw new Error(
      `ステータス計算に失敗しました: ${response.status}`,
    );
  }

  return response.json() as Promise<StatusCalculationResponse>;
}

export async function analyzeActivity(
  payload: ActivityPayload,
): Promise<AnalysisResult> {
  const response = await fetch(
    `${API_BASE_URL}/api/activity/analyze`,
    {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type":
          "application/json",
      },
      body: JSON.stringify(payload),
    },
  );

  if (!response.ok) {
    throw new Error(
      `活動分析に失敗しました: ${response.status}`,
    );
  }

  return response.json() as Promise<AnalysisResult>;
}