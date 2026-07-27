export type MatchPlayer = "playerA" | "playerB";

export type MatchEventType =
  | "match_start"
  | "punch"
  | "strong_punch"
  | "combo"
  | "low_health"
  | "knockdown"
  | "match_end";

export type MatchEvent = {
  type: MatchEventType;
  player?: MatchPlayer;
  power?: number;
  comboCount?: number;
  player1Hp?: number;
  player2Hp?: number;
  winner?: MatchPlayer;
};