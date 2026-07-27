export type MatchPlayer =
  | "playerA"
  | "playerB";

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

export type MatchStatus = {
  current_round: number;
  is_active: boolean;
  time_left: number;
  player1_hp: number;
  player2_hp: number;
  player1_total_punches: number;
  player2_total_punches: number;
  player1_strong_hits: number;
  player2_strong_hits: number;
  logs: string[];
};