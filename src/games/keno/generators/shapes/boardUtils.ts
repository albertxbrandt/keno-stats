// src/games/keno/generators/shapes/boardUtils.ts
// Board position calculations for 8x5 Keno grid

/**
 * Board position (row, col)
 */
export interface BoardPosition {
  row: number;
  col: number;
}

/**
 * Get row and column for a number (1-40)
 * 
 * Keno board layout (8x5 grid):
 * Row 0 (1-8):   1  2  3  4  5  6  7  8
 * Row 1 (9-16):  9 10 11 12 13 14 15 16
 * Row 2 (17-24): 17 18 19 20 21 22 23 24
 * Row 3 (25-32): 25 26 27 28 29 30 31 32
 * Row 4 (33-40): 33 34 35 36 37 38 39 40
 */
export function getPosition(num: number): BoardPosition {
  const row = Math.floor((num - 1) / 8);
  const col = (num - 1) % 8;
  return { row, col };
}

/**
 * Get number from row and column
 * Returns null if position is out of bounds
 */
export function getNumber(row: number, col: number): number | null {
  if (row < 0 || row > 4 || col < 0 || col > 7) return null;
  return row * 8 + col + 1;
}
