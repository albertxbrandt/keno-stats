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
   * Check if cached predictions exist and are still valid based on interval
   * @param {string} method - Generator method name (frequency, cold, etc.)
   * @param {number} count - Number of predictions
   * @param {Object} state - Global state object (contains generatorAutoRefresh, generatorInterval, generatorLastRefresh)
   * @param {Object} config - Method-specific config (pattern, placement, etc.)
   * @returns {Array<number>|null} Cached predictions if valid, null if expired/missing
   * @description
   * - autoRefresh=false (manual): cache never expires until user clicks Refresh
   * - autoRefresh=true (auto): cache expires after N rounds since last refresh
   */
  get(method, count, state, config = {}) {
    const key = this._getCacheKey(method, count, config);
    const cached = this.cache.get(key);

    if (!cached) return null;

    const { predictions } = cached;
    const autoRefresh = state.generatorAutoRefresh;
    const interval = state.generatorInterval || 5;
    const stayIfProfitable = state.generatorStayIfProfitable;

    // Manual refresh (autoRefresh off): always use cache until manually refreshed
    if (!autoRefresh) {
      return predictions;
    }

    // Auto refresh: check if enough rounds have passed since last refresh
    const currentRound = state.currentHistory.length;
    const lastRefresh = state.generatorLastRefresh || 0;
    const roundsSinceRefresh = currentRound - lastRefresh;

    if (roundsSinceRefresh < interval) {
      // Still within interval, use cache
      return predictions;
    }

    // Interval exceeded - check profitability if enabled
    if (stayIfProfitable) {
      // Calculate total profit from last 'interval' rounds
      const recentRounds = state.currentHistory.slice(-interval);
      let totalProfit = 0;

      for (const round of recentRounds) {
        if (round.kenoBet?.amount !== undefined && round.kenoBet?.payout !== undefined) {
          const amount = parseFloat(round.kenoBet.amount) || 0;
          const payout = parseFloat(round.kenoBet.payout) || 0;
          const profit = payout - amount;
          totalProfit += profit;
        }
      }

      // If profitable, keep current numbers and reset interval counter
      if (totalProfit > 0) {
        state.generatorLastRefresh = currentRound;
        return predictions;
      }
    }

    // Interval exceeded and not profitable, cache expired
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

    this.cache.set(key, {
      predictions,
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
