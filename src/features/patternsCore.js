// src/features/patternsCore.js - Core pattern analysis logic (UI-agnostic)
import { state } from '../core/state.js';
import { getDrawn } from '../core/storage.js';
import { showLoadingModal, hideLoadingModal, showPatternModal } from './patternsBridge.js';

// Cache for pattern analysis results
const patternCache = {
  data: new Map(), // key: `${patternSize}-${historyLength}-${sampleSize}` -> { patterns, stats, timestamp }
  maxAge: 300000, // 5 minutes

  get(patternSize, historyLength, sampleSize) {
    const key = `${patternSize}-${historyLength}-${sampleSize}`;
    const cached = this.data.get(key);

    if (cached && Date.now() - cached.timestamp < this.maxAge) {
      return cached;
    }
    return null;
  },

  set(patternSize, historyLength, sampleSize, patterns, stats) {
    const key = `${patternSize}-${historyLength}-${sampleSize}`;
    this.data.set(key, {
      patterns,
      stats,
      timestamp: Date.now()
    });
  },

  clear() {
    this.data.clear();
  }
};

// Clear cache when history changes (expose globally)
window.__keno_clearPatternCache = () => patternCache.clear();

/**
 * Export clear function
 */
export function clearPatternCache() {
  patternCache.clear();
}

/**
 * Generate all combinations of size k from an array
 */
function getCombinations(arr, k) {
  const result = [];

  function backtrack(start, current) {
    if (current.length === k) {
      result.push([...current]);
      return;
    }

    for (let i = start; i < arr.length; i++) {
      current.push(arr[i]);
      backtrack(i + 1, current);
      current.pop();
    }
  }

  backtrack(0, []);
  return result;
}

/**
 * Analyze history to find the most common patterns (number combinations)
 * of a specific size that appear together
 * @param {number} patternSize - Size of pattern to find (3-10)
 * @param {number} topN - How many top patterns to return (default 10)
 * @param {boolean} useCache - Whether to use cached results (default true)
 * @param {number} sampleSize - Number of recent rounds to analyze (0 = all history)
 * @returns {Array<Object>} Array of pattern objects with numbers, frequency, and occurrences
 */
export function findCommonPatterns(patternSize, topN = 10, useCache = true, sampleSize = 0) {
  if (!patternSize || patternSize < 3 || patternSize > 10) {
    console.warn('[patterns] Invalid pattern size:', patternSize);
    return [];
  }

  const historyLength = state.currentHistory.length;
  const effectiveSampleSize =
    sampleSize > 0 ? Math.min(sampleSize, historyLength) : historyLength;

  // Check cache first
  if (useCache) {
    const cached = patternCache.get(patternSize, historyLength, effectiveSampleSize);
    if (cached) {
      return cached.patterns.slice(0, topN);
    }
  }

  const patternCounts = {}; // Map of pattern key -> { numbers: [], count: number, occurrences: [] }

  // Get the sample of history to analyze
  const historyToAnalyze =
    effectiveSampleSize > 0
      ? state.currentHistory.slice(-effectiveSampleSize)
      : state.currentHistory;

  const startIndex = historyLength - historyToAnalyze.length;

  // Analyze history
  historyToAnalyze.forEach((round, idx) => {
    const roundIndex = startIndex + idx;
    const drawnNumbers = getDrawn(round);

    // Generate all combinations of patternSize from the drawn numbers
    const combinations = getCombinations(drawnNumbers, patternSize);

    combinations.forEach((combo) => {
      const sorted = combo.sort((a, b) => a - b);
      const key = sorted.join(',');

      if (!patternCounts[key]) {
        patternCounts[key] = { numbers: sorted, count: 0, occurrences: [] };
      }
      patternCounts[key].count++;
      // Store round index and timestamp
      patternCounts[key].occurrences.push({
        roundIndex,
        betNumber: roundIndex + 1,
        time: round.time,
        drawn: drawnNumbers
      });
    });
  });

  // Sort by frequency
  const sortedPatterns = Object.values(patternCounts).sort((a, b) => b.count - a.count);

  // Calculate hotness score for each pattern (lower = hotter/more clustered)
  sortedPatterns.forEach((pattern) => {
    if (pattern.occurrences.length > 1) {
      // Calculate average gap between occurrences
      const gaps = [];
      for (let i = 1; i < pattern.occurrences.length; i++) {
        gaps.push(pattern.occurrences[i].roundIndex - pattern.occurrences[i - 1].roundIndex);
      }
      pattern.avgGap = gaps.reduce((sum, gap) => sum + gap, 0) / gaps.length;
      pattern.hotness = pattern.avgGap; // Lower is hotter
    } else {
      pattern.avgGap = historyLength;
      pattern.hotness = historyLength;
    }

    // Last occurrence round index for recency sorting
    pattern.lastOccurrenceIndex =
      pattern.occurrences[pattern.occurrences.length - 1].roundIndex;
  });

  // Cache the full result
  if (useCache) {
    const stats = {
      totalCombinations: sortedPatterns.length,
      avgAppearance:
        sortedPatterns.length > 0
          ? (
            sortedPatterns.reduce((sum, p) => sum + p.count, 0) / sortedPatterns.length
          ).toFixed(1)
          : 0
    };
    patternCache.set(patternSize, historyLength, effectiveSampleSize, sortedPatterns, stats);
  }

  return sortedPatterns.slice(0, topN);
}

/**
 * Calculate statistics for a specific pattern size
 * @param {number} patternSize - Size of pattern (3-10)
 * @param {number} sampleSize - Number of recent rounds to analyze (0 = all)
 * @returns {Object} Statistics about patterns of this size
 */
export function getPatternStats(patternSize, sampleSize = 0) {
  if (state.currentHistory.length === 0) return { totalCombinations: 0, avgAppearance: 0 };

  const historyLength = state.currentHistory.length;
  const effectiveSampleSize =
    sampleSize > 0 ? Math.min(sampleSize, historyLength) : historyLength;

  // Check cache first
  const cached = patternCache.get(patternSize, historyLength, effectiveSampleSize);
  if (cached && cached.stats) {
    return cached.stats;
  }

  // Trigger computation which will cache the results
  const patterns = findCommonPatterns(patternSize, 1000, true, sampleSize);
  const totalCombinations = patterns.length;
  const avgAppearance =
    patterns.length > 0
      ? (patterns.reduce((sum, p) => sum + p.count, 0) / patterns.length).toFixed(1)
      : 0;

  return { totalCombinations, avgAppearance };
}

/**
 * Display pattern analysis results in a modal
 * @param {number} patternSize - The size of patterns to find (3-10)
 * @param {string} sortBy - Sort method: 'frequency', 'recent', 'hot'
 * @param {number} sampleSize - Number of recent rounds to analyze (0 = all)
 */
export function showPatternAnalysisModal(patternSize, sortBy = 'frequency', sampleSize = 0) {
  // Show loading modal first
  showLoadingModal();

  // Use setTimeout to allow the loading modal to render
  setTimeout(() => {
    try {
      let patterns = findCommonPatterns(patternSize, 100, true, sampleSize);

      // Apply sorting
      if (sortBy === 'recent') {
        patterns.sort((a, b) => b.lastOccurrenceIndex - a.lastOccurrenceIndex);
      } else if (sortBy === 'hot') {
        patterns.sort((a, b) => a.hotness - b.hotness);
      }
      // Default 'frequency' is already sorted by count

      patterns = patterns.slice(0, 15);
      const stats = getPatternStats(patternSize, sampleSize);

      // Remove loading modal
      hideLoadingModal();

      if (patterns.length === 0) {
        alert(
          `No pattern data available.\nPlay more rounds to analyze patterns of size ${patternSize}.`
        );
        return;
      }

      // Callback to refresh with new filters
      const handleRefresh = (newSortBy, newSampleSize) => {
        showPatternAnalysisModal(patternSize, newSortBy, newSampleSize);
      };

      // Show results modal using Preact component
      showPatternModal(patternSize, patterns, stats, sortBy, sampleSize, handleRefresh);
    } catch (error) {
      console.error('[patterns] Error analyzing patterns:', error);
      hideLoadingModal();
      alert('Error analyzing patterns. Please try again.');
    }
  }, 100);
}
