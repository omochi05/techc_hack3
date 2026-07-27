import type {
  MatchEvent,
  MatchPlayer,
} from "../types/match";

const STRONG_PUNCH_THRESHOLD = 80;

export function createMatchStartEvent(): MatchEvent {
  return {
    type: "match_start",
  };
}

export function createPunchEvent(
  player: MatchPlayer,
  power: number,
): MatchEvent {
  return {
    type:
      power >= STRONG_PUNCH_THRESHOLD
        ? "strong_punch"
        : "punch",
    player,
    power,
  };
}

export function createComboEvent(
  player: MatchPlayer,
  comboCount: number,
): MatchEvent {
  return {
    type: "combo",
    player,
    comboCount,
  };
}

export function createLowHealthEvent(
  player1Hp: number,
  player2Hp: number,
): MatchEvent {
  const player: MatchPlayer =
    player1Hp <= player2Hp
      ? "playerA"
      : "playerB";

  return {
    type: "low_health",
    player,
    player1Hp,
    player2Hp,
  };
}

export function createKnockdownEvent(
  player: MatchPlayer,
): MatchEvent {
  return {
    type: "knockdown",
    player,
  };
}

export function createMatchEndEvent(
  winner: MatchPlayer,
): MatchEvent {
  return {
    type: "match_end",
    winner,
  };
}