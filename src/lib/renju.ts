import { BoardState, Cell, ForbiddenCheckResult, Player, RuleMode } from './types';

export const BOARD_SIZE = 15;

export function createEmptyBoard(): BoardState {
  return Array.from({ length: BOARD_SIZE }, () => Array(BOARD_SIZE).fill(null));
}

// 4 cardinal directions: horizontal, vertical, diagonal (\), diagonal (/)
const DIRECTIONS = [
  { dx: 1, dy: 0 },
  { dx: 0, dy: 1 },
  { dx: 1, dy: 1 },
  { dx: 1, dy: -1 },
];

export function isInBoard(x: number, y: number): boolean {
  return x >= 0 && x < BOARD_SIZE && y >= 0 && y < BOARD_SIZE;
}

// Count consecutive stones in a given direction from (x, y)
export function countConsecutive(
  board: BoardState,
  x: number,
  y: number,
  dx: number,
  dy: number,
  player: Player
): number {
  let count = 0;
  let curX = x + dx;
  let curY = y + dy;

  while (isInBoard(curX, curY) && board[curY][curX] === player) {
    count++;
    curX += dx;
    curY += dy;
  }
  return count;
}

// Check win condition after placing stone at (x, y)
export function checkWin(
  board: BoardState,
  x: number,
  y: number,
  player: Player,
  ruleMode: RuleMode
): boolean {
  for (const { dx, dy } of DIRECTIONS) {
    const forward = countConsecutive(board, x, y, dx, dy, player);
    const backward = countConsecutive(board, x, y, -dx, -dy, player);
    const total = 1 + forward + backward;

    if (player === 'black') {
      if (ruleMode === 'renju') {
        if (total === 5) return true;
        // Overline (6+) is NOT a win in Renju, it's a forbidden move!
      } else {
        if (total >= 5) return true;
      }
    } else {
      // White wins on 5 or more (even in Renju)
      if (total >= 5) return true;
    }
  }
  return false;
}

// Extract a line segment around (x, y) along (dx, dy) up to distance 5 in both directions
function getLinePattern(
  board: BoardState,
  x: number,
  y: number,
  dx: number,
  dy: number,
  player: Player
): { pattern: number[]; centerIdx: number } {
  const pattern: number[] = [];
  const range = 5;
  const opp: Player = player === 'black' ? 'white' : 'black';

  for (let i = -range; i <= range; i++) {
    const cx = x + i * dx;
    const cy = y + i * dy;
    if (!isInBoard(cx, cy)) {
      pattern.push(2); // 2 represents wall / opponent boundary
    } else if (cx === x && cy === y) {
      pattern.push(1); // 1 represents current player's stone (the hypothetical placed stone)
    } else {
      const cell = board[cy][cx];
      if (cell === player) pattern.push(1);
      else if (cell === opp) pattern.push(2);
      else pattern.push(0); // 0 represents empty
    }
  }

  return { pattern, centerIdx: range };
}

// Check if placing black stone at (x, y) creates an overline (6목 이상)
export function isOverline(board: BoardState, x: number, y: number): boolean {
  for (const { dx, dy } of DIRECTIONS) {
    const forward = countConsecutive(board, x, y, dx, dy, 'black');
    const backward = countConsecutive(board, x, y, -dx, -dy, 'black');
    if (1 + forward + backward > 5) {
      return true;
    }
  }
  return false;
}

// Count number of '4's created in a direction for Black
// A '4' is a configuration of 4 black stones and 1 empty spot where placing black forms an exact 5
export function countFoursInDirection(
  board: BoardState,
  x: number,
  y: number,
  dx: number,
  dy: number
): number {
  let fours = 0;
  // Test each empty spot within distance 4 along the direction
  // Temporarily place the stone at (x, y)
  const tempBoard = board.map(row => [...row]);
  tempBoard[y][x] = 'black';

  const testedSpots = new Set<string>();

  for (let step = -4; step <= 4; step++) {
    const testX = x + step * dx;
    const testY = y + step * dy;

    if (!isInBoard(testX, testY) || tempBoard[testY][testX] !== null) continue;

    const spotKey = `${testX},${testY}`;
    if (testedSpots.has(spotKey)) continue;
    testedSpots.add(spotKey);

    // If placing black at testX, testY forms exactly 5, then the current line has a four!
    tempBoard[testY][testX] = 'black';
    const f1 = countConsecutive(tempBoard, testX, testY, dx, dy, 'black');
    const b1 = countConsecutive(tempBoard, testX, testY, -dx, -dy, 'black');
    if (1 + f1 + b1 === 5) {
      fours++;
    }
    tempBoard[testY][testX] = null;
  }

  return fours > 0 ? 1 : 0;
}

// Count number of 'Open 3's created in a direction for Black
// An 'Open 3' is an arrangement of 3 black stones that can become an 'Open 4' on the next move without violating forbidden rules
export function countOpenThreesInDirection(
  board: BoardState,
  x: number,
  y: number,
  dx: number,
  dy: number
): number {
  const tempBoard = board.map(row => [...row]);
  tempBoard[y][x] = 'black';

  let openThrees = 0;
  const testedSpots = new Set<string>();

  for (let step = -4; step <= 4; step++) {
    const testX = x + step * dx;
    const testY = y + step * dy;

    if (!isInBoard(testX, testY) || tempBoard[testY][testX] !== null) continue;

    const spotKey = `${testX},${testY}`;
    if (testedSpots.has(spotKey)) continue;
    testedSpots.add(spotKey);

    // Check if placing black at (testX, testY) creates an Open 4
    tempBoard[testY][testX] = 'black';

    // Must not be an overline
    const forward = countConsecutive(tempBoard, testX, testY, dx, dy, 'black');
    const backward = countConsecutive(tempBoard, testX, testY, -dx, -dy, 'black');
    const total = 1 + forward + backward;

    if (total === 4) {
      // Check if both ends are empty (Open 4)
      const end1X = testX + (forward + 1) * dx;
      const end1Y = testY + (forward + 1) * dy;
      const end2X = testX - (backward + 1) * dx;
      const end2Y = testY - (backward + 1) * dy;

      const end1Empty = isInBoard(end1X, end1Y) && tempBoard[end1Y][end1X] === null;
      const end2Empty = isInBoard(end2X, end2Y) && tempBoard[end2Y][end2X] === null;

      if (end1Empty && end2Empty) {
        // Can either end form an exact 5 without being an overline?
        let validEnd = 0;
        if (1 + countConsecutive(tempBoard, end1X, end1Y, dx, dy, 'black') + countConsecutive(tempBoard, end1X, end1Y, -dx, -dy, 'black') === 5) validEnd++;
        if (1 + countConsecutive(tempBoard, end2X, end2Y, dx, dy, 'black') + countConsecutive(tempBoard, end2X, end2Y, -dx, -dy, 'black') === 5) validEnd++;

        if (validEnd >= 2) {
          openThrees++;
        }
      }
    }

    tempBoard[testY][testX] = null;
  }

  return openThrees > 0 ? 1 : 0;
}

// Complete check for Renju forbidden moves (흑돌 금수)
export function checkForbiddenMove(
  board: BoardState,
  x: number,
  y: number,
  player: Player,
  ruleMode: RuleMode
): ForbiddenCheckResult {
  // Only Black has forbidden moves in Renju
  if (player !== 'black' || ruleMode !== 'renju') {
    return { forbidden: false };
  }

  // If already occupied, cannot place
  if (board[y][x] !== null) {
    return { forbidden: true };
  }

  // 1. Check Win Exception: If move forms an exact 5, it wins and is NOT forbidden!
  const tempBoard = board.map(row => [...row]);
  tempBoard[y][x] = 'black';
  for (const { dx, dy } of DIRECTIONS) {
    const f = countConsecutive(tempBoard, x, y, dx, dy, 'black');
    const b = countConsecutive(tempBoard, x, y, -dx, -dy, 'black');
    if (1 + f + b === 5) {
      return { forbidden: false };
    }
  }

  // 2. Overline check (6목 이상 금수)
  if (isOverline(board, x, y)) {
    return { forbidden: true, reason: 'overline' };
  }

  // 3. 4-4 check (사사 금수)
  let fourCount = 0;
  for (const { dx, dy } of DIRECTIONS) {
    fourCount += countFoursInDirection(board, x, y, dx, dy);
    if (fourCount >= 2) {
      return { forbidden: true, reason: '4-4' };
    }
  }

  // 4. 3-3 check (삼삼 금수)
  let threeCount = 0;
  for (const { dx, dy } of DIRECTIONS) {
    threeCount += countOpenThreesInDirection(board, x, y, dx, dy);
    if (threeCount >= 2) {
      return { forbidden: true, reason: '3-3' };
    }
  }

  return { forbidden: false };
}
