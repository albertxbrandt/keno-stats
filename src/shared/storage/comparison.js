// src/storage/comparison.js
// Comparison window data tracking (in-memory only, no persistence)

import { state } from '@/keno-tool/core/state.js';
import betMultis from '@/../config/bet-multis.json';

/**
 * Calculate profit for a prediction based on hits and difficulty
 * @param {number} patternSize - Number of numbers in pattern
 * @param {number} hits - Number of hits achieved
 * @param {string} difficulty - Game difficulty (classic, low, medium, high)
 * @returns {number} Profit multiplier
 */
export function calculateProfit(patternSize, hits, difficulty) {
  try {
    const difficultyData = betMultis[difficulty];
    if (!difficultyData) return 0;

    const patternData = difficultyData[patternSize.toString()];
    if (!patternData) return 0;

    const multiplier = patternData[hits.toString()];
    return multiplier || 0;
  } catch (e) {
    console.error('[Comparison] Profit calculation error:', e);
    return 0;
  }
}

/**
 * Detect game difficulty from UI
 * @returns {string|null} Detected difficulty or null
 */
export function detectGameDifficulty() {
  try {
    const difficultySelect = document.querySelector('select[data-testid="game-difficulty"]');
    if (difficultySelect && difficultySelect.value) {
      return difficultySelect.value;
    }
  } catch {
    // Silently fail
  }
  return null;
}

/**
 * Track a round for comparison analysis
 * @param {Object} roundData - { drawn, predictions }
 */
export function trackRoundComparison(roundData) {
  const { drawn, predictions } = roundData;
  if (!drawn || drawn.length === 0 || !predictions) return;

  const count = state.generatorCount || 3;
  const difficulty = state.gameDifficulty || 'classic';

  // Calculate hits and profit for each method
  const methods = ['frequency', 'cold', 'mixed', 'average', 'momentum', 'auto', 'shapes'];
  const dataPoint = {
    round: state.currentHistory.length,
    difficulty
  };

  methods.forEach((method) => {
    const predicted = predictions[method] || [];
    const hits = predicted.filter((n) => drawn.includes(n)).length;
    const profit = calculateProfit(count, hits, difficulty);

    dataPoint[method] = {
      predicted,
      hits,
      count,
      profit
    };
  });

  state.comparisonData.push(dataPoint);

  // Trim to lookback size
  if (state.comparisonData.length > state.comparisonLookback) {
    state.comparisonData.shift();
  }
}
