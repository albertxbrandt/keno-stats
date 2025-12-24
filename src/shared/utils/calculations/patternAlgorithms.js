// src/features/patternsCore.js - Core pattern analysis logic (UI-agnostic)
import { state } from '@/keno-tool/core/state.js';
import { getDrawn } from '@/keno-tool/core/storage.js';
import { getPatternCache } from '../../storage/patterns.js';

// Get pattern cache instance from storage
const patternCache = getPatternCache();

/**
 * Re-export clear function for external use
 */
export { clearPatternCache } from '../../storage/patterns.js';

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

  // Get the sample of history to analyze
  const historyToAnalyze =
    effectiveSampleSize > 0
      ? state.currentHistory.slice(-effectiveSampleSize)
      : state.currentHistory;

  // Use timestamp of latest round in sample as cache key
  const latestTimestamp = historyToAnalyze.length > 0
    ? historyToAnalyze[historyToAnalyze.length - 1].time
    : 0;

  // Check cache first
  if (useCache) {
    const cached = patternCache.get(patternSize, latestTimestamp, effectiveSampleSize);
    if (cached) {
      return cached.patterns.slice(0, topN);
    }
  }

  const patternCounts = {}; // Map of pattern key -> { numbers: [], count: number, occurrences: [] }

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
    patternCache.set(patternSize, latestTimestamp, effectiveSampleSize, sortedPatterns, stats);
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

  const historyToAnalyze =
    effectiveSampleSize > 0
      ? state.currentHistory.slice(-effectiveSampleSize)
      : state.currentHistory;

  const latestTimestamp = historyToAnalyze.length > 0
    ? historyToAnalyze[historyToAnalyze.length - 1].time
    : 0;

  // Check cache first
  const cached = patternCache.get(patternSize, latestTimestamp, effectiveSampleSize);
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
