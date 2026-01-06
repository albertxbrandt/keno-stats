// src/games/keno/generators/shapes/shapeSelection.ts
// Shape selection algorithms: weighted random and smart selection

import { type ShapeDefinition, SHAPE_DEFINITIONS } from "./shapeDefinitions";

import { getValidPositions, generateShape } from "./shapeValidation";
import {
  calculateFrequency,
  calculateMomentum,
  type HistoryRound,
} from "./analysisUtils";

/**
 * Keno state interface (minimal required fields)
 */
interface KenoState {
  shapesUsageHistory?: string[];
}

/**
 * Extended window interface with keno state
 */
declare global {
  interface Window {
    __keno_state?: KenoState;
  }
}

/**
 * Weighted random shape selection: favors shapes not used recently
 * Creates natural variety without strict predictable order
 *
 * @param count - Desired number of predictions
 * @returns Weighted random shape (less likely to repeat recent selections)
 */
export function selectWeightedRandomShape(count: number): ShapeDefinition {
  // Access global state for usage history persistence
  if (typeof window === "undefined" || !window.__keno_state) {
    // Fallback if state not available: pure random
    const matchingShapes = Object.entries(SHAPE_DEFINITIONS).filter(
      ([_key, shape]) => shape.offsets.length === count
    );
    if (matchingShapes.length > 0) {
      return matchingShapes[
        Math.floor(Math.random() * matchingShapes.length)
      ]![1];
    }
    const allShapes = Object.entries(SHAPE_DEFINITIONS);
    return allShapes[Math.floor(Math.random() * allShapes.length)]![1];
  }

  const state = window.__keno_state;

  // Initialize usage history if needed
  if (!state.shapesUsageHistory) {
    state.shapesUsageHistory = [];
  }

  // Get all shapes that have at least the desired count (can be trimmed to fit)
  const matchingShapes = Object.entries(SHAPE_DEFINITIONS).filter(
    ([_key, shape]) => shape.offsets.length >= count
  );

  let shapesToConsider: [string, ShapeDefinition][];
  if (matchingShapes.length === 0) {
    // No shapes have enough offsets, use all shapes anyway
    shapesToConsider = Object.entries(SHAPE_DEFINITIONS);
  } else {
    shapesToConsider = matchingShapes;
  }

  // Calculate weights based on usage history
  // Recent usage = lower weight, not used recently = higher weight
  const weights = shapesToConsider.map(([key, shape]) => {
    const historySize = state.shapesUsageHistory!.length;
    const lastUsedIndex = state.shapesUsageHistory!.lastIndexOf(key);

    if (lastUsedIndex === -1) {
      // Never used or not in recent history: maximum weight
      return { key, shape, weight: 10 };
    }

    // Calculate recency (0 = most recent, higher = older)
    const recency = historySize - lastUsedIndex - 1;

    // Weight increases with recency (exponential)
    // Most recent (recency=0): weight ≈ 0.5
    // 2 shapes ago (recency=2): weight ≈ 2
    // 5 shapes ago (recency=5): weight ≈ 7
    const weight = Math.max(0.5, recency * 1.5);

    return { key, shape, weight };
  });

  // Weighted random selection
  const totalWeight = weights.reduce((sum, item) => sum + item.weight, 0);
  let random = Math.random() * totalWeight;

  let selectedShape: ShapeDefinition | undefined;
  let selectedKey: string | undefined;

  for (const item of weights) {
    random -= item.weight;
    if (random <= 0) {
      selectedShape = item.shape;
      selectedKey = item.key;
      break;
    }
  }

  // Fallback safety
  if (!selectedShape || !selectedKey) {
    selectedShape = weights[0]!.shape;
    selectedKey = weights[0]!.key;
  }

  // Track usage (keep last 20 selections)
  state.shapesUsageHistory!.push(selectedKey);
  if (state.shapesUsageHistory!.length > 20) {
    state.shapesUsageHistory!.shift();
  }

  return selectedShape;
}

/**
 * Smart shape selection: scores all shapes and picks the best one for the placement strategy
 *
 * @param count - Desired number of predictions
 * @param placement - Placement strategy (hot/cold/trending/random)
 * @param historyData - Game history
 * @param sampleSize - Analysis window size
 * @returns Best shape definition for the placement strategy
 */
export function selectSmartShape(
  count: number,
  placement: string,
  historyData: HistoryRound[],
  sampleSize: number
): ShapeDefinition {
  // If no history or random placement, pick any shape that matches count
  if (placement === "random" || !historyData || historyData.length === 0) {
    const matchingShapes = Object.entries(SHAPE_DEFINITIONS).filter(
      ([_key, shape]) => shape.offsets.length === count
    );
    if (matchingShapes.length > 0) {
      const [_key, shape] =
        matchingShapes[Math.floor(Math.random() * matchingShapes.length)]!;
      return shape;
    }
    // Fallback: any shape
    const allShapes = Object.entries(SHAPE_DEFINITIONS);
    return allShapes[Math.floor(Math.random() * allShapes.length)]![1];
  }

  // Score each shape based on placement strategy
  const shapeScores: Array<{
    key: string;
    shape: ShapeDefinition;
    score: number;
    positionCount: number;
  }> = [];

  for (const [key, shape] of Object.entries(SHAPE_DEFINITIONS)) {
    // Skip shapes that don't match count exactly (for now)
    if (shape.offsets.length !== count) continue;

    const validPositions = getValidPositions(shape.offsets);
    if (validPositions.length === 0) continue;

    // Score all positions for this shape
    let totalScore = 0;
    let positionCount = 0;

    for (const pos of validPositions) {
      const shapeNumbers = generateShape(pos.row, pos.col, shape.offsets);
      let posScore = 0;

      if (placement === "hot") {
        // Hot: sum of frequencies (higher is better)
        const frequency = calculateFrequency(historyData, sampleSize);
        posScore = shapeNumbers.reduce(
          (sum, num) => sum + (frequency[num] || 0),
          0
        );
      } else if (placement === "cold") {
        // Cold: inverse of frequencies (lower freq is better, so negate)
        const frequency = calculateFrequency(historyData, sampleSize);
        posScore = shapeNumbers.reduce(
          (sum, num) => sum - (frequency[num] || 0),
          0
        );
      } else if (placement === "trending") {
        // Trending: sum of momentum ratios
        const momentum = calculateMomentum(historyData, sampleSize);
        posScore = shapeNumbers.reduce(
          (sum, num) => sum + (momentum[num] || 1.0),
          0
        );
      }

      totalScore += posScore;
      positionCount++;
    }

    // Average score across all valid positions
    const avgScore = positionCount > 0 ? totalScore / positionCount : 0;
    shapeScores.push({ key, shape, score: avgScore, positionCount });
  }

  // If no shapes match exact count, relax constraint
  if (shapeScores.length === 0) {
    const allShapes = Object.entries(SHAPE_DEFINITIONS);
    return allShapes[Math.floor(Math.random() * allShapes.length)]![1];
  }

  // Sort by score (descending) and pick best
  shapeScores.sort((a, b) => b.score - a.score);
  return shapeScores[0]!.shape;
}
