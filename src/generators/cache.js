/**
 * Cache Manager for generator predictions
 * Handles universal refresh interval logic for all generators
 */
export class CacheManager {
  constructor() {
    this.cache = new Map();
  }

  /**
   * Generate cache key
   * @param {string} method - Generator method name
   * @param {number} count - Prediction count
   * @param {Object} config - Additional config (pattern, placement, etc.)
   * @returns {string}
   * @private
   */
  _getCacheKey(method, count, config = {}) {
    // Include relevant config in cache key
    const configStr = JSON.stringify(config);
    return `${method}-${count}-${configStr}`;
  }

  /**
   * Check if cached predictions exist and are still valid
   * @param {string} method
   * @param {number} count
   * @param {Object} state - Global state object
   * @param {Object} config
   * @returns {Array|null} Cached predictions or null
   */
  get(method, count, state, config = {}) {
    const key = this._getCacheKey(method, count, config);
    const cached = this.cache.get(key);

    if (!cached) return null;

    const { predictions, roundNumber } = cached;
    const interval = state.generatorInterval || 0;

    // Manual refresh (interval = 0): always use cache until manually refreshed
    if (interval === 0) {
      return predictions;
    }

    // Auto refresh: check if enough rounds have passed
    const currentRound = state.generatorLastRefresh || 0;
    const roundsSinceCache = currentRound - roundNumber;

    if (roundsSinceCache < interval) {
      // Still within interval, use cache
      return predictions;
    }

    // Interval exceeded, cache expired
    return null;
  }

  /**
   * Store predictions in cache
   * @param {string} method
   * @param {number} count
   * @param {Array} predictions
   * @param {Object} state - Global state object
   * @param {Object} config
   */
  set(method, count, predictions, state, config = {}) {
    const key = this._getCacheKey(method, count, config);
    const roundNumber = state.generatorLastRefresh || 0;

    this.cache.set(key, {
      predictions,
      roundNumber,
      timestamp: Date.now()
    });
  }

  /**
   * Clear all cached predictions
   */
  clear() {
    this.cache.clear();
  }

  /**
   * Clear cache for specific method
   * @param {string} method
   */
  clearMethod(method) {
    for (const key of this.cache.keys()) {
      if (key.startsWith(`${method}-`)) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Get cache statistics
   * @returns {Object}
   */
  getStats() {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }
}

// Export singleton instance
export const cacheManager = new CacheManager();
