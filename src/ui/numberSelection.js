// src/numberSelection.js
// UI functions for selecting and displaying generated numbers

import { state } from '../core/state.js';
import { getHits, getMisses } from '../core/storage.js';
import { highlightPrediction } from '../features/heatmap.js';
import { generatorFactory, cacheManager } from '../generators/index.js';
import { replaceSelection } from '../utils/tileSelection.js';

// ============================================================================
// GENERATOR WRAPPER FUNCTIONS (for backward compatibility)
// These delegate to the new generator system
// ============================================================================

/**
 * Generate predictions for all methods at once
 * Used for comparison tracking
 */
export function generateAllPredictions() {
  const count = state.generatorCount || 3;
  const predictions = {};

  // Generate predictions for each method
  for (const method of generatorFactory.getKeys()) {
    const result = generateNumbers(false, method);
    predictions[method] = result.predictions;
  }

  return predictions;
}

/**
 * Main generator function - unified entry point for all methods
 * @param {boolean} forceRefresh - Force cache bypass
 * @param {string} methodOverride - Use specific method instead of state.generatorMethod
 * @returns {Object} { predictions, cached, actuallyRefreshed }
 */
export function generateNumbers(forceRefresh = false, methodOverride = null) {
  const method = methodOverride || state.generatorMethod || 'frequency';
  const count = state.generatorCount || 3;
  const history = state.currentHistory || [];

  // Build method-specific config
  const config = buildGeneratorConfig(method);

  // Check cache first (unless forced)
  if (!forceRefresh) {
    const cached = cacheManager.get(method, count, state, config);
    if (cached) {
      console.log(`[generateNumbers] Using cached ${method} predictions`);
      return {
        predictions: cached,
        cached: true,
        actuallyRefreshed: false
      };
    }
  }

  // Generate fresh predictions
  const generator = generatorFactory.get(method);
  if (!generator) {
    console.error(`[generateNumbers] Unknown method: ${method}`);
    return {
      predictions: [],
      cached: false,
      actuallyRefreshed: false
    };
  }

  console.log(`[generateNumbers] Generating ${method} predictions (count: ${count})`);
  const predictions = generator.generate(count, history, config);

  // Update cache and state
  cacheManager.set(method, count, predictions, state, config);
  state.generatedNumbers = predictions;
  state.generatorActuallyRefreshed = true;

  // Update last refresh round counter
  const currentRound = history.length;
  state.generatorLastRefresh = currentRound;

  return {
    predictions,
    cached: false,
    actuallyRefreshed: true
  };
}

/**
 * Build method-specific configuration
 * @param {string} method
 * @returns {Object}
 */
function buildGeneratorConfig(method) {
  const config = {
    sampleSize: state.sampleSize || 100
  };

  // Add method-specific settings
  if (method === 'shapes') {
    config.pattern = state.shapesPattern || 'random';
    config.placement = state.shapesPlacement || 'random';
  }

  if (method === 'momentum') {
    config.detectionWindow = state.momentumDetectionWindow || 10;
    config.baselineWindow = state.momentumBaselineWindow || 50;
    config.threshold = state.momentumThreshold || 1.5;
    config.poolSize = state.momentumPoolSize || 15;
  }

  if (method === 'auto') {
    config.comparison = state.generatorComparison || [];
  }

  return config;
}

/**
 * Legacy compatibility functions - delegate to new system
 */
export function getTopPredictions(count) {
  const generator = generatorFactory.get('frequency');
  return generator.generate(count, state.currentHistory, { sampleSize: state.sampleSize });
}

export function getColdPredictions(count) {
  const generator = generatorFactory.get('cold');
  return generator.generate(count, state.currentHistory, { sampleSize: state.sampleSize });
}

export function getMixedPredictions(count) {
  const generator = generatorFactory.get('mixed');
  return generator.generate(count, state.currentHistory, { sampleSize: state.sampleSize });
}

export function getAveragePredictions(count) {
  const generator = generatorFactory.get('average');
  return generator.generate(count, state.currentHistory, { sampleSize: state.sampleSize });
}

export function getAutoPredictions(count) {
  const generator = generatorFactory.get('auto');
  const config = {
    sampleSize: state.sampleSize,
    comparison: state.generatorComparison || []
  };
  return generator.generate(count, state.currentHistory, config);
}

export function getMomentumBasedPredictions(count) {
  const generator = generatorFactory.get('momentum');
  const config = buildGeneratorConfig('momentum');
  return generator.generate(count, state.currentHistory, config);
}

// ============================================================================
// NUMBER SELECTION & UI FUNCTIONS
// ============================================================================

/**
 * Select generated numbers on game board
 */
export function selectPredictedNumbers() {
  const predictions = state.generatedNumbers || [];
  if (predictions.length === 0) {
    console.warn('[selectPredictedNumbers] No predictions available');
    return;
  }

  console.log(`[selectPredictedNumbers] Selecting ${predictions.length} tiles:`, predictions);

  // Use shared tile selection utility
  const result = replaceSelection(predictions);
  if (result.failed.length > 0) {
    console.warn('[selectPredictedNumbers] Failed to select tiles:', result.failed);
  }

  // Highlight predictions
  highlightPrediction(predictions);
}

/**
 * Legacy prediction function (for old UI compatibility)
 */
export function calculatePrediction(countOverride) {
  const input = document.getElementById('predict-count');
  const count = getIntValue(input, countOverride || 3);

  if (state.currentHistory.length === 0) {
    state.predictedNumbers = [];
    return [];
  }

  const predictions = getTopPredictions(count);
  state.predictedNumbers = predictions;
  highlightPrediction(predictions);

  return predictions;
}

// ============================================================================
// MOMENTUM-SPECIFIC UI FUNCTIONS (kept for backward compatibility)
// ============================================================================

export function updateMomentumPredictions() {
  if (state.generatorMethod !== 'momentum') return;

  const result = generateNumbers(true, 'momentum');
  state.momentumNumbers = result.predictions;
  state.generatedNumbers = result.predictions;

  console.log('[Momentum] Updated predictions:', result.predictions);
}

export function selectMomentumNumbers() {
  if (!state.momentumNumbers || state.momentumNumbers.length === 0) {
    console.warn('[Momentum] No momentum numbers to select');
    return;
  }

  state.generatedNumbers = state.momentumNumbers;
  selectPredictedNumbers();
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get momentum configuration from state
 */
export function getMomentumConfig() {
  return {
    patternSize: state.generatorCount || 3,
    detectionWindow: state.momentumDetectionWindow || 10,
    baselineWindow: state.momentumBaselineWindow || 50,
    threshold: state.momentumThreshold || 1.5,
    poolSize: state.momentumPoolSize || 15
  };
}
