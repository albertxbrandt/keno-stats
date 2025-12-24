// src/utils/analysis/combinationAnalysis.js
// Helper functions for analyzing number combinations

import { getDrawn } from '../../core/storage.js';

/**
 * Analyze how often a combination has hit all numbers in history
 * @param {Array<number>} numbers - Numbers to analyze
 * @param {Array} history - Round history data
 * @returns {Array} Array of hit occurrences with historyIndex and time
 */
export function analyzeCombinationHits(numbers, history) {
  const hits = [];

  history.forEach((round, index) => {
    const drawnNumbers = getDrawn(round);
    const allNumbersHit = numbers.every((num) => drawnNumbers.includes(num));

    if (allNumbersHit) {
      hits.push({
        historyIndex: index,
        time: round.time,
        drawn: drawnNumbers
      });
    }
  });

  return hits;
}

/**
 * Calculate the hit rate for a combination
 * @param {Array<number>} numbers - Numbers to analyze
 * @param {Array} history - Round history data
 * @returns {Object} { totalRounds, hits, hitRate }
 */
export function calculateHitRate(numbers, history) {
  const hits = analyzeCombinationHits(numbers, history);
  const totalRounds = history.length;
  const hitRate = totalRounds > 0 ? (hits.length / totalRounds) * 100 : 0;

  return {
    totalRounds,
    hits: hits.length,
    hitRate: hitRate.toFixed(2)
  };
}

/**
 * Find the longest gap between hits for a combination
 * @param {Array<number>} numbers - Numbers to analyze
 * @param {Array} history - Round history data
 * @returns {Object} { longestGap, currentGap, lastHitIndex }
 */
export function findHitGaps(numbers, history) {
  const hitIndices = analyzeCombinationHits(numbers, history).map(h => h.historyIndex);

  if (hitIndices.length === 0) {
    return {
      longestGap: history.length,
      currentGap: history.length,
      lastHitIndex: -1
    };
  }

  let longestGap = 0;
  for (let i = 1; i < hitIndices.length; i++) {
    const gap = hitIndices[i] - hitIndices[i - 1];
    if (gap > longestGap) longestGap = gap;
  }

  const lastHitIndex = hitIndices[hitIndices.length - 1];
  const currentGap = history.length - 1 - lastHitIndex;

  return {
    longestGap,
    currentGap,
    lastHitIndex
  };
}
