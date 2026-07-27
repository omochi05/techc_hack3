export type CommentaryEventType =
  | "match_start"
  | "punch"
  | "strong_punch"
  | "combo"
  | "low_health"
  | "knockdown"
  | "match_end";

export type CommentaryPlayer =
  | "playerA"
  | "playerB";

export type CommentaryRequest = {
  event_type: CommentaryEventType;
  player?: CommentaryPlayer;
  power?: number;
  combo_count?: number;
  player1_hp?: number;
  player2_hp?: number;
  winner?: CommentaryPlayer;
};

export type CommentaryResponse = {
  commentary: string;
};

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ??
  "http://127.0.0.1:8000";

export async function generateCommentary(
  request: CommentaryRequest,
): Promise<CommentaryResponse> {
  const response = await fetch(
    `${API_BASE_URL}/api/commentary/generate`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(request),
    },
  );

  if (!response.ok) {
    throw new Error(
      `実況APIの呼び出しに失敗しました: ${response.status}`,
    );
  }

  const data: CommentaryResponse =
    await response.json();

  return data;
}