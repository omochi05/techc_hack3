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