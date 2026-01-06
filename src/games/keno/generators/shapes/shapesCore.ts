// src/games/keno/generators/shapes/shapesCore.ts
// Main orchestrator for shape-based number generation

import { type ShapeDefinition, SHAPE_DEFINITIONS } from "./shapeDefinitions";
import {
  getValidPositions,
  generateShape,
  adjustShapeSize,
} from "./shapeValidation";
import {
  selectHotPosition,
  selectColdPosition,
  selectTrendingPosition,
} from "./placementStrategies";
import { selectWeightedRandomShape, selectSmartShape } from "./shapeSelection";
import { type HistoryRound } from "./analysisUtils";

/**
 * Shape info stored globally for UI display
 */
export interface ShapeInfo {
  name: string;
  emoji: string;
  numbers: number[];
  placement: string;
}

/**
 * Extended window interface with shape info
 */
declare global {
  interface Window {
    __keno_lastShapeInfo?: ShapeInfo;
  }
}

/**
 * Generate shape-based predictions
 *
 * @param count - Number of predictions (will try to match with shape size)
 * @param pattern - Shape pattern key, 'random' for random, or 'smart' for best-fit
 * @param placement - Placement strategy ('random', 'hot', 'cold', 'trending')
 * @param historyData - Game history for hot/trending placement
 * @param sampleSize - Number of recent games to analyze (default 20)
 * @returns Array of numbers forming a shape
 */
export function getShapePredictions(
  count = 5,
  pattern = "random",
  placement = "random",
  historyData: HistoryRound[] = [],
  sampleSize = 20
): number[] {
  let selectedShape: ShapeDefinition;

  // Select shape based on pattern parameter
  if (pattern === "smart") {
    // Smart selection: score all shapes based on placement strategy
    selectedShape = selectSmartShape(count, placement, historyData, sampleSize);
  } else if (pattern === "random") {
    // Weighted random: favors shapes not used recently for better variety
    selectedShape = selectWeightedRandomShape(count);
  } else {
    // Use specific pattern
    const shape = SHAPE_DEFINITIONS[pattern];

    if (!shape) {
      console.error("[Shapes] Invalid pattern:", pattern, "- using random");
      const allShapes = Object.entries(SHAPE_DEFINITIONS);
      [, selectedShape] =
        allShapes[Math.floor(Math.random() * allShapes.length)]!;
    } else {
      selectedShape = shape;
    }
  }

  // Get valid positions for this shape (use full offsets for validation)
  const validPositions = getValidPositions(selectedShape.offsets);

  if (validPositions.length === 0) {
    console.error("[Shapes] No valid positions for shape:", selectedShape.name);
    return [];
  }

  // Slice offsets to match desired count (important for shapes like crucifix)
  const offsetsToUse = selectedShape.offsets.slice(0, count);

  // Select position based on placement strategy
  let position;
  switch (placement) {
    case "hot":
      position = selectHotPosition(
        validPositions,
        offsetsToUse,
        historyData,
        sampleSize
      );
      break;
    case "cold":
      position = selectColdPosition(
        validPositions,
        offsetsToUse,
        historyData,
        sampleSize
      );
      break;
    case "trending":
      position = selectTrendingPosition(
        validPositions,
        offsetsToUse,
        historyData,
        sampleSize
      );
      break;
    case "random":
    default:
      position =
        validPositions[Math.floor(Math.random() * validPositions.length)]!;
      break;
  }

  // Generate the shape at selected position using sliced offsets
  let numbers = generateShape(position.row, position.col, offsetsToUse);

  // Adjust size if needed
  if (numbers.length !== count) {
    numbers = adjustShapeSize(numbers, count);
  }

  // Store last shape info for UI display
  if (typeof window !== "undefined") {
    window.__keno_lastShapeInfo = {
      name: selectedShape.name,
      emoji: selectedShape.emoji,
      numbers: numbers,
      placement: placement,
    };
  }

  return numbers;
}

// Re-export for backward compatibility
export { getAllShapes } from "./shapeDefinitions";
