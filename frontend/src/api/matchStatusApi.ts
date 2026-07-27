import type {
  MatchStatus,
} from "../types/matchStatus";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ??
  "http://127.0.0.1:8000";

export async function getMatchStatus():
Promise<MatchStatus> {
  const response = await fetch(
    `${API_BASE_URL}/api/matches/match-status`,
  );

  if (!response.ok) {
    throw new Error(
      `試合ステータスの取得に失敗しました: ${response.status}`,
    );
  }

  return response.json() as Promise<MatchStatus>;
}