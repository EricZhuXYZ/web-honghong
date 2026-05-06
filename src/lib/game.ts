import type { GameState, GamePhase } from "@/types/game";

export const INITIAL_AFFECTION = 20;
export const MAX_AFFECTION = 100;
export const MIN_AFFECTION = -50;
export const WIN_AFFECTION = 80;
export const MAX_ROUNDS = 10;

export function clampAffection(value: number): number {
  return Math.max(MIN_AFFECTION, Math.min(MAX_AFFECTION, value));
}

export function affectionToProgress(affection: number): number {
  return ((affection - MIN_AFFECTION) / (MAX_AFFECTION - MIN_AFFECTION)) * 100;
}

export function getProgressColor(affection: number): string {
  if (affection < 0) return "#ef4444";
  if (affection < 50) return "#eab308";
  if (affection < 80) return "#3b82f6";
  return "#22c55e";
}

export function getProgressLabel(affection: number): string {
  if (affection < 0) return "关系危险";
  if (affection < 50) return "仍在生气";
  if (affection < 80) return "逐渐缓和";
  return "已经哄好";
}

export function getPhase(state: GameState): GamePhase {
  if (state.gameOver) return "gameOver";
  if (state.gender === null) return "start";
  return "playing";
}

export function createInitialState(): GameState {
  return {
    step: 0,
    affection: INITIAL_AFFECTION,
    gender: null,
    scenario: null,
    voiceType: null,
    messages: [],
    currentOptions: [],
    gameOver: false,
    won: false,
    loading: false,
    error: null,
  };
}

export function checkGameEnd(
  affection: number,
  step: number
): { gameOver: boolean; won: boolean } {
  if (affection >= WIN_AFFECTION) {
    return { gameOver: true, won: true };
  }
  if (affection <= MIN_AFFECTION) {
    return { gameOver: true, won: false };
  }
  if (step >= MAX_ROUNDS && affection < WIN_AFFECTION) {
    return { gameOver: true, won: false };
  }
  return { gameOver: false, won: false };
}
