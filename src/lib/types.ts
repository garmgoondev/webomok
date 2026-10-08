export type Player = 'black' | 'white';
export type Cell = Player | null;
export type BoardState = Cell[][]; // 15x15

export type GameMode = 'ai' | 'pass_and_play' | 'friend_link';
export type AIDifficulty = 'easy' | 'medium' | 'hard';
export type RuleMode = 'renju' | 'free';

export interface Move {
  x: number;
  y: number;
  player: Player;
  moveNumber: number;
  timestamp: number;
}

export type GameStatus = 'playing' | 'black_win' | 'white_win' | 'draw';

export interface ForbiddenCheckResult {
  forbidden: boolean;
  reason?: '3-3' | '4-4' | 'overline';
}
