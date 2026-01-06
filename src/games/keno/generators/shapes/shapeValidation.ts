// src/games/keno/generators/shapes/shapeValidation.ts
// Shape validation, generation, and adjustment utilities

import { type ShapeOffset } from "./shapeDefinitions";
import { type BoardPosition, getNumber, getPosition } from "./boardUtils";

/**
 * Check if a shape can fit at a given center position
 */
export function canShapeFit(
  centerRow: number,
  centerCol: number,
  offsets: ShapeOffset[]
): boolean {
  for (const offset of offsets) {
    const row = centerRow + offset.dRow;
    const col = centerCol + offset.dCol;
    if (row < 0 || row > 4 || col < 0 || col > 7) {
      return false;
    }
  }
  return true;
}

/**
 * Generate numbers for a shape at a given position
 * Returns sorted array of numbers (1-40)
 */
export function generateShape(
  centerRow: number,
  centerCol: number,
  offsets: ShapeOffset[]
): number[] {
  const numbers: number[] = [];
  for (const offset of offsets) {
    const row = centerRow + offset.dRow;
    const col = centerCol + offset.dCol;
    const num = getNumber(row, col);
    if (num) numbers.push(num);
  }
  return numbers.sort((a, b) => a - b);
}

/**
 * Get all valid positions for a shape
 */
export function getValidPositions(offsets: ShapeOffset[]): BoardPosition[] {
  const validPositions: BoardPosition[] = [];
  for (let row = 0; row < 5; row++) {
    for (let col = 0; col < 8; col++) {
      if (canShapeFit(row, col, offsets)) {
        validPositions.push({ row, col });
      }
    }
  }
  return validPositions;
}

/**
 * Adjust shape to match desired count by adding/removing numbers
 */
export function adjustShapeSize(
  numbers: number[],
  targetCount: number
): number[] {
  if (numbers.length === targetCount) return numbers;

  // If we need more numbers, add adjacent ones
  if (numbers.length < targetCount) {
    const needed = targetCount - numbers.length;
    const adjacent = getAdjacentNumbers(numbers);
    const toAdd = adjacent.filter((n) => !numbers.includes(n)).slice(0, needed);
    numbers = [...numbers, ...toAdd].sort((a, b) => a - b);
  }
  // If we have too many, trim
  else if (numbers.length > targetCount) {
    numbers = numbers.slice(0, targetCount);
  }

  return numbers;
}

/**
 * Get numbers adjacent to a set of numbers (orthogonal only)
 */
export function getAdjacentNumbers(numbers: number[]): number[] {
  const adjacent = new Set<number>();
  const offsets: ShapeOffset[] = [
    { dRow: -1, dCol: 0 },
    { dRow: 1, dCol: 0 },
    { dRow: 0, dCol: -1 },
    { dRow: 0, dCol: 1 },
  ];

  for (const num of numbers) {
    const pos = getPosition(num);
    for (const offset of offsets) {
      const newNum = getNumber(pos.row + offset.dRow, pos.col + offset.dCol);
      if (newNum && !numbers.includes(newNum)) {
        adjacent.add(newNum);
      }
    }
  }

  return Array.from(adjacent);
}
