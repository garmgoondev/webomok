import { BoardState, Player, RuleMode, AIDifficulty } from './types';
import { BOARD_SIZE, isInBoard, checkForbiddenMove, checkWin, countConsecutive } from './renju';

interface ScoredMove {
  x: number;
  y: number;
  score: number;
}

const DIRECTIONS = [
  { dx: 1, dy: 0 },
  { dx: 0, dy: 1 },
  { dx: 1, dy: 1 },
  { dx: 1, dy: -1 },
];

// Evaluate line pattern strength
function evaluateLine(
  board: BoardState,
  x: number,
  y: number,
  dx: number,
  dy: number,
  player: Player
): number {
  const opp: Player = player === 'black' ? 'white' : 'black';
  const f = countConsecutive(board, x, y, dx, dy, player);
  const b = countConsecutive(board, x, y, -dx, -dy, player);
  const count = 1 + f + b;

  const fEndX = x + (f + 1) * dx;
  const fEndY = y + (f + 1) * dy;
  const bEndX = x - (b + 1) * dx;
  const bEndY = y - (b + 1) * dy;

  const fOpen = isInBoard(fEndX, fEndY) && board[fEndY][fEndX] === null;
  const bOpen = isInBoard(bEndX, bEndY) && board[bEndY][bEndX] === null;

  if (count >= 5) return 100000; // 5 in a row (Win)
  if (count === 4) {
    if (fOpen && bOpen) return 20000; // Open 4 (Unstoppable)
    if (fOpen || bOpen) return 5000;  // Closed 4
  }
  if (count === 3) {
    if (fOpen && bOpen) return 4000;  // Open 3
    if (fOpen || bOpen) return 800;   // Closed 3
  }
  if (count === 2) {
    if (fOpen && bOpen) return 500;   // Open 2
    if (fOpen || bOpen) return 100;   // Closed 2
  }
  return 10;
}

// Evaluate a candidate move for a player
function evaluateCandidateMove(
  board: BoardState,
  x: number,
  y: number,
  player: Player,
  ruleMode: RuleMode
): number {
  // If player is black, respect forbidden moves in Renju
  if (player === 'black' && ruleMode === 'renju') {
    const f = checkForbiddenMove(board, x, y, 'black', 'renju');
    if (f.forbidden) return -1000000;
  }

  const opp: Player = player === 'black' ? 'white' : 'black';
  let myScore = 0;
  let oppScore = 0;

  // Temporarily place the stone
  board[y][x] = player;
  if (checkWin(board, x, y, player, ruleMode)) {
    board[y][x] = null;
    return 10000000; // Immediate win
  }

  for (const { dx, dy } of DIRECTIONS) {
    myScore += evaluateLine(board, x, y, dx, dy, player);
  }
  board[y][x] = null;

  // Check how critical this spot is for opponent (Defensive value)
  board[y][x] = opp;
  if (checkWin(board, x, y, opp, ruleMode)) {
    board[y][x] = null;
    return 5000000; // Must block opponent win!
  }

  for (const { dx, dy } of DIRECTIONS) {
    oppScore += evaluateLine(board, x, y, dx, dy, opp);
  }
  board[y][x] = null;

  // Center proximity bonus (center is 7, 7)
  const distFromCenter = Math.abs(x - 7) + Math.abs(y - 7);
  const centerBonus = Math.max(0, 14 - distFromCenter) * 10;

  return myScore * 1.1 + oppScore + centerBonus;
}

// Get candidate moves near existing stones (within distance 2)
function getCandidateMoves(board: BoardState): { x: number; y: number }[] {
  const candidates: { x: number; y: number }[] = [];
  const checked = Array.from({ length: BOARD_SIZE }, () => Array(BOARD_SIZE).fill(false));
  let hasStones = false;

  for (let y = 0; y < BOARD_SIZE; y++) {
    for (let x = 0; x < BOARD_SIZE; x++) {
      if (board[y][x] !== null) {
        hasStones = true;
        for (let dy = -2; dy <= 2; dy++) {
          for (let dx = -2; dx <= 2; dx++) {
            const nx = x + dx;
            const ny = y + dy;
            if (isInBoard(nx, ny) && board[ny][nx] === null && !checked[ny][nx]) {
              checked[ny][nx] = true;
              candidates.push({ x: nx, y: ny });
            }
          }
        }
      }
    }
  }

  // If first move of game, return center (7, 7)
  if (!hasStones) {
    return [{ x: 7, y: 7 }];
  }

  return candidates;
}

// Get AI's next move
export function calculateAIMove(
  board: BoardState,
  aiPlayer: Player,
  difficulty: AIDifficulty,
  ruleMode: RuleMode
): { x: number; y: number } {
  const candidates = getCandidateMoves(board);
  if (candidates.length === 0) {
    return { x: 7, y: 7 };
  }

  // Score all candidate moves
  const scoredMoves: ScoredMove[] = candidates.map(({ x, y }) => ({
    x,
    y,
    score: evaluateCandidateMove(board, x, y, aiPlayer, ruleMode),
  }));

  // Filter out forbidden moves for Black
  const validMoves = scoredMoves.filter(m => m.score > -500000);
  const movesToUse = validMoves.length > 0 ? validMoves : scoredMoves;

  // Sort descending by score
  movesToUse.sort((a, b) => b.score - a.score);

  if (difficulty === 'easy') {
    // Top 3 moves with random choice
    const topN = movesToUse.slice(0, Math.min(4, movesToUse.length));
    const randomIdx = Math.floor(Math.random() * topN.length);
    return { x: topN[randomIdx].x, y: topN[randomIdx].y };
  }

  if (difficulty === 'medium') {
    // Mostly best move, small chance of 2nd best
    if (movesToUse.length > 1 && Math.random() < 0.15) {
      return { x: movesToUse[1].x, y: movesToUse[1].y };
    }
    return { x: movesToUse[0].x, y: movesToUse[0].y };
  }

  // Hard difficulty: Minimax 2-ply lookahead on top 5 moves
  const topMoves = movesToUse.slice(0, Math.min(6, movesToUse.length));
  const opp: Player = aiPlayer === 'black' ? 'white' : 'black';
  let bestScore = -Infinity;
  let bestMove = topMoves[0];

  for (const move of topMoves) {
    board[move.y][move.x] = aiPlayer;
    if (checkWin(board, move.x, move.y, aiPlayer, ruleMode)) {
      board[move.y][move.x] = null;
      return { x: move.x, y: move.y };
    }

    // Look at opponent's best response
    const oppCandidates = getCandidateMoves(board).slice(0, 8);
    let maxOppResponse = 0;
    for (const oppMove of oppCandidates) {
      const oppScore = evaluateCandidateMove(board, oppMove.x, oppMove.y, opp, ruleMode);
      if (oppScore > maxOppResponse) {
        maxOppResponse = oppScore;
      }
    }

    const netScore = move.score - maxOppResponse * 0.8;
    board[move.y][move.x] = null;

    if (netScore > bestScore) {
      bestScore = netScore;
      bestMove = move;
    }
  }

  return { x: bestMove.x, y: bestMove.y };
}
