// src/features/savedNumbersCore.js - Core saved numbers logic (UI-agnostic)
import { state } from '../core/state.js';
import { getDrawn } from '../core/storage.js';

const storageApi = typeof browser !== 'undefined' ? browser : chrome;

// Load bet multipliers data
let betMultipliers = null;
fetch(chrome.runtime.getURL('config/bet-multis.json'))
  .then((res) => res.json())
  .then((data) => {
    betMultipliers = data;
  })
  .catch((err) => console.error('[savedNumbers] Failed to load bet multipliers:', err));

/**
 * Save a number combination
 * @param {Array<number>} numbers - Array of numbers (1-40)
 * @param {string} name - Optional name for the combination
 */
export function saveNumberCombination(numbers, name = '') {
  return storageApi.storage.local.get('savedNumbers').then((res) => {
    const savedNumbers = res.savedNumbers || [];
    const comboName = name || `Combo ${savedNumbers.length + 1}`;

    savedNumbers.push({
      id: Date.now(),
      numbers: numbers.sort((a, b) => a - b),
      name: comboName,
      createdAt: Date.now()
    });

    return storageApi.storage.local.set({ savedNumbers }).then(() => {
      return savedNumbers;
    });
  });
}

/**
 * Get all saved number combinations
 */
export function getSavedNumbers() {
  return storageApi.storage.local.get('savedNumbers').then((res) => {
    return res.savedNumbers || [];
  });
}

/**
 * Delete a saved number combination
 * @param {number} id - Combination ID
 */
export function deleteSavedNumber(id) {
  return storageApi.storage.local.get('savedNumbers').then((res) => {
    let savedNumbers = res.savedNumbers || [];
    savedNumbers = savedNumbers.filter((c) => c.id !== id);
    return storageApi.storage.local.set({ savedNumbers }).then(() => {
      return savedNumbers;
    });
  });
}

/**
 * Track recently played numbers
 * @param {Array<number>} numbers - Numbers that were just played
 */
export function trackPlayedNumbers(numbers) {
  return storageApi.storage.local.get('recentlyPlayed').then((res) => {
    let recentlyPlayed = res.recentlyPlayed || [];

    const sortedNumbers = numbers.sort((a, b) => a - b);
    const numbersKey = sortedNumbers.join(',');

    // Remove this combination if it already exists (to move it to front)
    recentlyPlayed = recentlyPlayed.filter((play) => {
      const playKey = play.numbers.sort((a, b) => a - b).join(',');
      return playKey !== numbersKey;
    });

    // Add to front of array with updated timestamp
    recentlyPlayed.unshift({
      numbers: sortedNumbers,
      playedAt: Date.now()
    });

    // Keep only last 10 unique combinations
    recentlyPlayed = recentlyPlayed.slice(0, 10);

    return storageApi.storage.local.set({ recentlyPlayed }).then(() => {
      return recentlyPlayed;
    });
  });
}

/**
 * Get recently played numbers
 */
export function getRecentlyPlayed() {
  return storageApi.storage.local.get('recentlyPlayed').then((res) => {
    return res.recentlyPlayed || [];
  });
}

/**
 * Analyze how often a combination has hit all numbers in history
 * @param {Array<number>} numbers - Numbers to analyze
 * @returns {Array} Array of hit occurrences with historyIndex and time
 */
export function analyzeCombinationHits(numbers) {
  const hits = [];

  state.currentHistory.forEach((round, index) => {
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
 * Generate payout graph HTML for a combination
 * @param {Array<number>} numbers - Numbers to analyze
 * @param {number} lookback - Number of recent rounds to analyze
 * @param {string} riskMode - Risk mode (classic, low, medium, high)
 * @returns {string} HTML string for the payout graph
 */
export function generatePayoutGraph(numbers, lookback = 50, riskMode = 'high') {
  if (!betMultipliers) {
    return '<div style="color:#666; text-align:center; padding:20px;">Loading payout data...</div>';
  }

  const numCount = numbers.length;
  const riskData = betMultipliers.risk[riskMode];
  const payouts = riskData[numCount] || {};

  const historyLength = state.currentHistory.length;
  const analyzedCount = Math.min(lookback, historyLength);
  const recentHistory = state.currentHistory.slice(-analyzedCount);

  // Count hits per combination size
  const hitCounts = {}; // { 0: count, 1: count, ... numCount: count }
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

  // Build HTML
  let html = `
    <div class="payout-graph-wrapper" style="background: #0f212e; padding: 15px; border-radius: 8px; margin-bottom: 15px;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
        <h3 style="color: #74b9ff; font-size: 14px; margin: 0;">Payout Distribution</h3>
      </div>

      <div style="color: #666; font-size: 11px; margin-bottom: 12px;">
        Based on last ${analyzedCount} rounds (${riskMode} risk)
      </div>

      <div style="display: flex; flex-direction: column; gap: 6px;">
  `;

  for (let i = numCount; i >= 0; i--) {
    const count = hitCounts[i];
    const percentage = hitPercentages[i];
    const payout = payouts[i] || 0;
    const barWidth = percentage > 0 ? Math.max(percentage, 5) : 0;

    const barColor =
      i === numCount
        ? '#00b894'
        : i >= numCount - 2
          ? '#74b9ff'
          : i >= numCount / 2
            ? '#fdcb6e'
            : '#ff7675';

    html += `
      <div style="display: flex; align-items: center; gap: 8px;">
        <div style="width: 50px; text-align: right; color: #888; font-size: 11px;">${i}/${numCount}</div>
        <div style="flex: 1; background: #14202b; border-radius: 4px; height: 24px; position: relative; overflow: hidden;">
          ${barWidth > 0
        ? `<div style="width: ${barWidth}%; height: 100%; background: ${barColor}; border-radius: 4px;"></div>`
        : ''
      }
        </div>
        <div style="width: 60px; text-align: right; color: #fff; font-size: 11px; font-weight: bold;">${percentage}%</div>
        <div style="width: 50px; text-align: right; color: ${payout > 0 ? '#00b894' : '#666'
      }; font-size: 11px;">${payout}x</div>
        <div style="width: 40px; text-align: right; color: #666; font-size: 10px;">${count}</div>
      </div>
    `;
  }

  html += `
      </div>

      <div style="display: flex; justify-content: space-between; margin-top: 12px; padding-top: 10px; border-top: 1px solid #1a2c38; font-size: 10px; color: #666;">
        <span>Hits / Total</span>
        <span>Frequency</span>
        <span>Payout</span>
        <span>Count</span>
      </div>
    </div>
  `;

  return html;
}

/**
 * Get saved preferences for graph display
 */
export function getGraphPreferences() {
  return storageApi.storage.local.get(['graphRiskMode', 'graphLookback']).then((result) => {
    return {
      riskMode: result.graphRiskMode || 'high',
      lookback: result.graphLookback || 50
    };
  });
}

/**
 * Save graph preferences
 */
export function saveGraphPreferences(riskMode, lookback) {
  return storageApi.storage.local.set({
    graphRiskMode: riskMode,
    graphLookback: lookback
  });
}
