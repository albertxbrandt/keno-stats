/**
 * Mines Heatmap Utility
 * Visualizes mine frequency across the 5x5 grid
 */

import type { MinesRoundData } from "@/shared/types/api";
import { COLORS } from "@/shared/constants/colors.js";

// Heatmap color thresholds (percentage)
const HOT_THRESHOLD = 25; // Red - very common mine position
const WARM_THRESHOLD = 20; // Orange
const NEUTRAL_THRESHOLD = 15; // Yellow
// Below 15% = Green/Cool

/**
 * Calculate mine frequency for each position (0-24)
 * @param history - All completed Mines rounds
 * @param maxRounds - Maximum number of recent rounds to analyze (default: 500)
 * @returns Object with position as key, frequency as value
 */
export function calculateMineFrequency(
  history: MinesRoundData[],
  maxRounds: number = 500
): Record<number, number> {
  const frequency: Record<number, number> = {};

  // Initialize all positions to 0
  for (let i = 0; i < 25; i++) {
    frequency[i] = 0;
  }

  // Use only recent rounds for performance and relevance
  const recentHistory = history.slice(0, maxRounds);

  // Count mines at each position
  recentHistory.forEach((round) => {
    round.minePositions.forEach((position) => {
      if (frequency[position] !== undefined) {
        frequency[position]++;
      }
    });
  });

  return frequency;
}

/**
 * Get color based on mine frequency percentage
 * @param percentage - How often a mine appears at this position
 * @returns CSS color string
 */
export function getHeatmapColor(percentage: number): string {
  if (percentage >= HOT_THRESHOLD) {
    return "#ef4444"; // Red - dangerous
  } else if (percentage >= WARM_THRESHOLD) {
    return "#f97316"; // Orange - risky
  } else if (percentage >= NEUTRAL_THRESHOLD) {
    return "#eab308"; // Yellow - neutral
  } else {
    return "#22c55e"; // Green - safer
  }
}

/**
 * Apply heatmap visualization to Mines board
 * @param history - All completed Mines rounds
 * @param opacity - Heatmap opacity (0-1)
 */
export function applyMinesHeatmap(
  history: MinesRoundData[],
  opacity: number = 0.3,
  maxRounds: number = 500
): void {
  if (history.length === 0) return;

  const frequency = calculateMineFrequency(history, maxRounds);
  // Use actual number of rounds analyzed (may be less than total history)
  const totalRounds = Math.min(history.length, maxRounds);

  // Apply to each tile
  for (let position = 0; position < 25; position++) {
    const tileNumber = position + 1; // Tiles are numbered 1-25
    const tile = document.querySelector(
      `[data-testid="game-tile-${tileNumber}"]`
    ) as HTMLElement;

    if (!tile) continue;

    const count = frequency[position] ?? 0;
    const percentage = (count / totalRounds) * 100;
    const color = getHeatmapColor(percentage);

    // Find the cover element (child of button)
    const cover = tile.querySelector(".cover") as HTMLElement;
    if (cover) {
      // Apply background color with opacity to the cover
      cover.style.backgroundColor = `${color}${Math.round(opacity * 255)
        .toString(16)
        .padStart(2, "0")}`;
    } else {
      // Fallback: apply to button if no cover found
      tile.style.backgroundColor = `${color}${Math.round(opacity * 255)
        .toString(16)
        .padStart(2, "0")}`;
    }

    // Add percentage badge
    let badge = tile.querySelector(".mines-heatmap-badge") as HTMLElement;
    if (!badge) {
      badge = document.createElement("div");
      badge.className = "mines-heatmap-badge";
      badge.style.cssText = `
        position: absolute;
        bottom: 4px;
        right: 4px;
        font-size: 10px;
        font-weight: 600;
        color: ${COLORS.text.primary};
        background: rgba(0, 0, 0, 0.7);
        padding: 2px 4px;
        border-radius: 3px;
        pointer-events: none;
        z-index: 10;
      `;
      tile.style.position = "relative";
      tile.appendChild(badge);
    }

    badge.textContent = `${percentage.toFixed(1)}%`;
    badge.style.display = "block";
  }
}

/**
 * Clear heatmap from Mines board
 */
export function clearMinesHeatmap(): void {
  for (let tileNumber = 1; tileNumber <= 25; tileNumber++) {
    const tile = document.querySelector(
      `[data-testid="game-tile-${tileNumber}"]`
    ) as HTMLElement;

    if (!tile) continue;

    // Remove background color from cover
    const cover = tile.querySelector(".cover") as HTMLElement;
    if (cover) {
      cover.style.backgroundColor = "";
    }
    // Remove background color from tile (fallback)
    tile.style.backgroundColor = "";

    // Remove badge
    const badge = tile.querySelector(".mines-heatmap-badge");
    if (badge) {
      badge.remove();
    }
  }
}

/**
 * Toggle heatmap on/off
 * @param history - All completed Mines rounds
 * @param enabled - Whether heatmap should be shown
 */
export function toggleMinesHeatmap(
  history: MinesRoundData[],
  enabled: boolean
): void {
  if (enabled) {
    applyMinesHeatmap(history);
  } else {
    clearMinesHeatmap();
  }
}
