// src/features/savedNumbersCore.js - Storage operations for saved numbers
// Pure storage functions - no UI, no calculations

const storageApi = typeof browser !== 'undefined' ? browser : chrome;

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

/**
 * Load bet multipliers data
 * @returns {Promise<Object>} Bet multipliers configuration
 */
export function loadBetMultipliers() {
  return fetch(chrome.runtime.getURL('config/bet-multis.json'))
    .then((res) => res.json())
    .catch((err) => {
      console.error('[savedNumbers] Failed to load bet multipliers:', err);
      return null;
    });
}
