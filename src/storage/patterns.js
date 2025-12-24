// src/storage/patterns.js
// Pattern analysis cache storage (in-memory)

/**
 * Pattern cache with TTL (Time To Live)
 * @type {Object}
 */
const patternCache = {
  data: new Map(), // key: `${patternSize}-${historyLength}-${sampleSize}` -> { patterns, stats, timestamp }
  maxAge: 300000, // 5 minutes

  /**
   * Get cached pattern analysis results
   * @param {number} patternSize - Size of patterns
   * @param {number} historyLength - Length of history analyzed
   * @param {number} sampleSize - Sample size used
   * @returns {Object|null} Cached data or null if expired/missing
   */
  get(patternSize, historyLength, sampleSize) {
    const key = `${patternSize}-${historyLength}-${sampleSize}`;
    const cached = this.data.get(key);

    if (cached && Date.now() - cached.timestamp < this.maxAge) {
      return cached;
    }
    return null;
  },

  /**
   * Store pattern analysis results in cache
   * @param {number} patternSize - Size of patterns
   * @param {number} historyLength - Length of history analyzed
   * @param {number} sampleSize - Sample size used
   * @param {Array} patterns - Pattern results
   * @param {Object} stats - Statistics
   */
  set(patternSize, historyLength, sampleSize, patterns, stats) {
    const key = `${patternSize}-${historyLength}-${sampleSize}`;
    this.data.set(key, {
      patterns,
      stats,
      timestamp: Date.now()
    });
  },

  /**
   * Clear all cached pattern data
   */
  clear() {
    this.data.clear();
  }
};

/**
 * Clear pattern cache (exported for external use)
 */
export function clearPatternCache() {
  patternCache.clear();
}

/**
 * Get pattern cache (for direct access by algorithms)
 */
export function getPatternCache() {
  return patternCache;
}

// Expose globally for external clearing
window.__keno_clearPatternCache = () => patternCache.clear();
