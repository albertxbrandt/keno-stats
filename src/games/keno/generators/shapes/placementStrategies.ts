// src/games/keno/generators/shapes/placementStrategies.ts
// Position selection strategies: hot, cold, and trending

import { type BoardPosition } from "./boardUtils";
import { type ShapeOffset } from "./shapeDefinitions";
import { generateShape } from "./shapeValidation";
import {
  calculateFrequency,
  calculateMomentum,
  type HistoryRound,
} from "./analysisUtils";

/**
 * Select shape position covering the most frequently drawn numbers
 *
 * Strategy:
 * 1. Counts frequency of each number 1-40 in last N rounds (sampleSize)
 * 2. Scores each position by sum of frequencies of numbers in that shape placement
 * 3. Returns random pick from top 3 positions (adds variety)
 *
 * @param validPositions - All valid positions for shape
 * @param offsets - Shape offsets from center
 * @param historyData - Game history
 * @param sampleSize - Number of recent games to analyze
 * @returns Position with high-frequency numbers (from top 3 scores)
 */
export function selectHotPosition(
  validPositions: BoardPosition[],
  offsets: ShapeOffset[],
  historyData: HistoryRound[],
  sampleSize = 20
): BoardPosition {
  if (!historyData || historyData.length === 0) {
    return validPositions[Math.floor(Math.random() * validPositions.length)]!;
  }

  // Count frequency of each number
  const frequency = calculateFrequency(historyData, sampleSize);

  // Score each valid position by sum of frequencies of numbers in shape
  const scoredPositions = validPositions.map((pos) => {
    const shapeNumbers = generateShape(pos.row, pos.col, offsets);
    const score = shapeNumbers.reduce(
      (sum, num) => sum + (frequency[num] || 0),
      0
    );
    return { ...pos, score };
  });

  // Sort by score descending and pick from top 3
  scoredPositions.sort((a, b) => b.score - a.score);
  const topPositions = scoredPositions.slice(0, 3);
  return topPositions[Math.floor(Math.random() * topPositions.length)]!;
}

/**
 * Select position based on cold areas (least frequently drawn numbers)
 *
 * Strategy:
 * 1. Counts frequency of each number 1-40 in last N rounds (sampleSize)
 * 2. Scores each position by sum of frequencies (LOWER is better for cold)
 * 3. Returns random pick from bottom 3 positions (adds variety)
 *
 * @param validPositions - All valid positions for shape
 * @param offsets - Shape offsets from center
 * @param historyData - Game history
 * @param sampleSize - Number of recent games to analyze
 * @returns Position with low-frequency numbers (from bottom 3 scores)
 */
export function selectColdPosition(
  validPositions: BoardPosition[],
  offsets: ShapeOffset[],
  historyData: HistoryRound[],
  sampleSize = 20
): BoardPosition {
  if (!historyData || historyData.length === 0) {
    return validPositions[Math.floor(Math.random() * validPositions.length)]!;
  }

  // Count frequency of each number
  const frequency = calculateFrequency(historyData, sampleSize);

  // Score each valid position by sum of frequencies of numbers in shape
  const scoredPositions = validPositions.map((pos) => {
    const shapeNumbers = generateShape(pos.row, pos.col, offsets);
    const score = shapeNumbers.reduce(
      (sum, num) => sum + (frequency[num] || 0),
      0
    );
    return { ...pos, score };
  });

  // Sort by score ASCENDING (lowest frequency first) and pick from bottom 3
  scoredPositions.sort((a, b) => a.score - b.score);
  const coldPositions = scoredPositions.slice(0, 3);
  return coldPositions[Math.floor(Math.random() * coldPositions.length)]!;
}

/**
 * Select position based on trending areas (momentum-like analysis)
 *
 * Strategy:
 * 1. Compares recent window (sampleSize) to baseline (4x sampleSize)
 * 2. Calculates momentum ratio for each number (recent/baseline)
 * 3. Scores positions by sum of momentum values
 * 4. Returns random pick from top 3 positions
 *
 * @param validPositions - All valid positions for shape
 * @param offsets - Shape offsets from center
 * @param historyData - Game history
 * @param sampleSize - Recent window size (baseline = 4x this)
 * @returns Position with trending-up numbers (from top 3 scores)
 */
export function selectTrendingPosition(
  validPositions: BoardPosition[],
  offsets: ShapeOffset[],
  historyData: HistoryRound[],
  sampleSize = 20
): BoardPosition {
  // Need at least 5x sampleSize for proper trending analysis
  const minHistory = sampleSize * 5;
  if (!historyData || historyData.length < minHistory) {
    return validPositions[Math.floor(Math.random() * validPositions.length)]!;
  }

  // Calculate momentum for all numbers
  const momentum = calculateMomentum(historyData, sampleSize);

  // Score each position by momentum
  const scoredPositions = validPositions.map((pos) => {
    const shapeNumbers = generateShape(pos.row, pos.col, offsets);
    const score = shapeNumbers.reduce(
      (sum, num) => sum + (momentum[num] || 0),
      0
    );
    return { ...pos, score };
  });

  // Sort by score descending and pick from top 3
  scoredPositions.sort((a, b) => b.score - a.score);
  const topPositions = scoredPositions.slice(0, 3);
  return topPositions[Math.floor(Math.random() * topPositions.length)]!;
}
