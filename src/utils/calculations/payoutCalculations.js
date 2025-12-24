// src/utils/calculations/payoutCalculations.js
// Pure calculation functions for payout analysis

import { getDrawn } from '../../core/storage.js';

/**
 * Calculate hit distribution for a set of numbers across history
 * @param {Array<number>} numbers - Numbers to analyze
 * @param {Array} history - Round history data
 * @param {number} lookback - Number of rounds to analyze
 * @returns {Object} { hitCounts, hitPercentages, analyzedCount }
 */
export function calculateHitDistribution(numbers, history, lookback) {
  const numCount = numbers.length;
  const analyzedCount = Math.min(lookback, history.length);
  const recentHistory = history.slice(-analyzedCount);

  // Count hits per combination size
  const hitCounts = {};
  for (let i = 0; i <= numCount; i++) {
    hitCounts[i] = 0;
  }

  recentHistory.forEach((round) => {
    const drawnNumbers = getDrawn(round);
    const hits = numbers.filter((num) => drawnNumbers.includes(num)).length;
    hitCounts[hits]++;
  });

  // Calculate percentages
  const hitPercentages = {};
  for (let i = 0; i <= numCount; i++) {
    hitPercentages[i] = analyzedCount > 0 ? ((hitCounts[i] / analyzedCount) * 100).toFixed(1) : 0;
  }

  return { hitCounts, hitPercentages, analyzedCount };
}

/**
 * Get payout multipliers for a given number count and risk mode
 * @param {Object} betMultipliers - Bet multipliers data
 * @param {string} riskMode - Risk mode (classic, low, medium, high)
 * @param {number} numCount - Number of numbers selected
 * @returns {Object} Payout multipliers { 0: x, 1: x, ..., numCount: x }
 */
export function getPayoutMultipliers(betMultipliers, riskMode, numCount) {
  if (!betMultipliers) return {};
  const riskData = betMultipliers.risk[riskMode];
  return riskData[numCount] || {};
}

/**
 * Get color for a bar based on hit count
 * @param {number} hitCount - Number of hits
 * @param {number} totalCount - Total numbers in combination
 * @returns {string} Hex color code
 */
export function getBarColor(hitCount, totalCount) {
  if (hitCount === totalCount) return '#00b894'; // Perfect hit - green
  if (hitCount >= totalCount - 2) return '#74b9ff'; // Close - blue
  if (hitCount >= totalCount / 2) return '#fdcb6e'; // Half - yellow
  return '#ff7675'; // Low - red
}
