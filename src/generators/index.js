/**
 * Central export for generator system
 * Provides clean API for using generators throughout the app
 */

export { BaseGenerator } from './base.js';
export { FrequencyGenerator } from './frequency.js';
export { ColdGenerator } from './cold.js';
export { MixedGenerator } from './mixed.js';
export { AverageGenerator } from './average.js';
export { AutoGenerator } from './auto.js';
export { MomentumGenerator } from './momentum.js';
export { ShapesGenerator } from './shapes.js';
export { GeneratorFactory, generatorFactory } from './factory.js';
export { CacheManager, cacheManager } from './cache.js';

// Import for use in this file's functions
import { generatorFactory } from './factory.js';
import { cacheManager } from './cache.js';

/**
 * Generate predictions using specified method
 * Main entry point for prediction generation
 * 
 * @param {string} method - Generator method key
 * @param {number} count - Number of predictions
 * @param {Array} history - Game history
 * @param {Object} state - Global state object
 * @param {Object} config - Method-specific configuration
 * @returns {Object} { predictions: Array, cached: boolean, actuallyRefreshed: boolean }
 */
export function generatePredictions(method, count, history, state, config = {}) {
  // Try to get from cache first
  const cached = cacheManager.get(method, count, state, config);
  if (cached) {
    return {
      predictions: cached,
      cached: true,
      actuallyRefreshed: false
    };
  }

  // Cache miss or expired - generate new predictions
  const generator = generatorFactory.get(method);
  if (!generator) {
    console.error(`[generators] Unknown method: ${method}`);
    return {
      predictions: [],
      cached: false,
      actuallyRefreshed: false
    };
  }

  // Add comparison data to config for auto method
  if (method === 'auto' && state.generatorComparison) {
    config.comparison = state.generatorComparison;
  }

  // Add sample size to config
  config.sampleSize = state.sampleSize || 100;

  const predictions = generator.generate(count, history, config);

  // Store in cache
  cacheManager.set(method, count, predictions, state, config);

  return {
    predictions,
    cached: false,
    actuallyRefreshed: true
  };
}

/**
 * Force refresh predictions (clears cache for method)
 * @param {string} method - Generator method key (or null for all)
 */
export function forceRefresh(method = null) {
  if (method) {
    cacheManager.clearMethod(method);
  } else {
    cacheManager.clear();
  }
}
