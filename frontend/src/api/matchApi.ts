import type {
  MatchStatus,
} from "../types/match";

export type MatchPlayer =
  | "playerA"
  | "playerB";

export type PunchResponse = {
  id: number;
  player: MatchPlayer;
  power: number;
  timestamp: string;
};

export type LatestPunchResponse = {
  punch: PunchResponse | null;
};

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ??
  "http://127.0.0.1:8000";

export async function getLatestPunch():
Promise<LatestPunchResponse> {
  const response = await fetch(
    `${API_BASE_URL}/api/matches/latest-punch`,
    {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
    },
  );

  if (!response.ok) {
    throw new Error(
      `最新パンチの取得に失敗しました: ${response.status}`,
    );
  }

  return response.json() as Promise<LatestPunchResponse>;
}

export async function getMatchStatus():
Promise<MatchStatus> {
  const response = await fetch(
    `${API_BASE_URL}/api/matches/match-status`,
    {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
    },
  );

  if (!response.ok) {
    throw new Error(
      `試合ステータスの取得に失敗しました: ${response.status}`,
    );
  }

  return response.json() as Promise<MatchStatus>;
}