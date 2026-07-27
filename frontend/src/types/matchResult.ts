export type MatchWinner = "playerA" | "playerB" | "draw";

export type MatchFinishType = "ko" | "decision";

export type MatchResult = {
  winner: MatchWinner;
  finishType: MatchFinishType;
  player1Hp: number;
  player2Hp: number;
  player1Punches: number;
  player2Punches: number;
  player1MaxCombo: number;
  player2MaxCombo: number;
  remainingTime: number;
};