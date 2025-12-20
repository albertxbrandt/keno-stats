// src/numberSelection.js
// UI functions for selecting and displaying generated numbers

import { state } from '../core/state.js';
import { highlightPrediction } from '../features/heatmap.js';
import { generatorFactory, cacheManager } from '../generators/index.js';
import { replaceSelection } from '../utils/tileSelection.js';
import { getIntValue } from '../utils/domReader.js';

// ============================================================================
// GENERATOR WRAPPER FUNCTIONS (for backward compatibility)
// These delegate to the new generator system
// ============================================================================

/**
 * Update the preview UI to show next predicted numbers and refresh countdown
 * Generates fresh predictions WITHOUT updating cache or state (preview only)
 * Shows countdown to next auto-refresh if interval > 0
 */
export function updateGeneratorPreview() {
  const previewContainer = document.getElementById('generator-preview-numbers');
  const methodLabel = document.getElementById('generator-preview-method');
  const roundsLabel = document.getElementById('generator-rounds-until-refresh');

  if (!previewContainer) return;

  const method = state.generatorMethod || 'frequency';
  const interval = state.generatorInterval || 0;
  const currentRound = state.currentHistory?.length || 0;
  const lastRefresh = state.generatorLastRefresh || 0;

  // Update method label
  const methodNames = {
    'frequency': '🔥 Hot',
    'cold': '❄️ Cold',
    'mixed': '🔀 Mixed',
    'average': '📊 Average',
    'momentum': '⚡ Momentum',
    'auto': '🤖 Auto',
    'shapes': '🔷 Shapes'
  };
  if (methodLabel) {
    methodLabel.textContent = methodNames[method] || method;
  }

  // Update rounds until refresh
  if (roundsLabel) {
    if (interval === 0) {
      roundsLabel.textContent = 'Manual';
      roundsLabel.style.color = '#666';
    } else {
      const roundsSinceRefresh = currentRound - lastRefresh;
      const roundsUntilRefresh = Math.max(0, interval - roundsSinceRefresh);
      roundsLabel.textContent = `${roundsUntilRefresh}/${interval} rounds`;
      roundsLabel.style.color = roundsUntilRefresh === 0 ? '#00b894' : '#74b9ff';
    }
  }

  // If manual mode (interval = 0), don't show preview
  if (interval === 0) {
    previewContainer.innerHTML = '<span style="color:#666; font-size:9px;">Click Refresh to generate</span>';
    return;
  }

  // Generate preview of what NEXT numbers will be (force fresh generation)
  // This shows what you'd get if you clicked Refresh now
  let previewPredictions = [];
  try {
    const count = state.generatorCount || 3;
    const history = state.currentHistory || [];
    const config = buildGeneratorConfig(method);

    const generator = generatorFactory.get(method);
    if (generator) {
      // Generate fresh preview without updating cache or state
      previewPredictions = generator.generate(count, history, config);
    }
  } catch (e) {
    console.error('[Preview] Failed to generate preview:', e);
  }

  // Update preview numbers
  if (previewPredictions.length === 0) {
    previewContainer.innerHTML = '<span style="color:#666; font-size:9px;">No predictions available</span>';
  } else {
    previewContainer.innerHTML = previewPredictions
      .map(num => `<span style="background:#2a3f4f; color:#74b9ff; padding:4px 8px; border-radius:4px; font-size:10px; font-weight:600;">${num}</span>`)
      .join('');
  }
}

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
 * Checks cache first unless forceRefresh=true, then generates fresh predictions
 * @param {boolean} forceRefresh - Force cache bypass and generate fresh predictions
 * @param {string} methodOverride - Use specific method instead of state.generatorMethod
 * @returns {Object} { predictions: number[], cached: boolean, actuallyRefreshed: boolean }
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
      // Update state.generatedNumbers even when cached (if active method)
      const isActiveMethod = !methodOverride || method === state.generatorMethod;
      if (isActiveMethod) {
        state.generatedNumbers = cached;
      }

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

  const predictions = generator.generate(count, history, config);

  // Update cache and state
  cacheManager.set(method, count, predictions, state, config);

  // Only update state.generatedNumbers if this is the active method
  // (not when generating for comparison tracking)
  const isActiveMethod = !methodOverride || method === state.generatorMethod;
  if (isActiveMethod) {
    state.generatedNumbers = predictions;
    state.generatorActuallyRefreshed = true;

    // Update last refresh round counter
    const currentRound = history.length;
    state.generatorLastRefresh = currentRound;
  }

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
    // sampleSize is used as detection window, baseline is 4x automatically
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

// ============================================================================
// NUMBER SELECTION & UI FUNCTIONS
// ============================================================================

/**
 * Select generated numbers on game board
 */
export async function selectPredictedNumbers() {
  const predictions = state.generatedNumbers || [];
  if (predictions.length === 0) {
    console.warn('[selectPredictedNumbers] No predictions available');
    return;
  }

  // Use shared tile selection utility (now async)
  const result = await replaceSelection(predictions);
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
// WINDOW HOOKS (for cross-module calls from HTML event handlers)
// ============================================================================

/**
 * Window hook wrapper for generateNumbers
 * Generates numbers and selects them on the board (only if auto-select is enabled)
 */
window.__keno_generateNumbers = function (forceRefresh = false) {
  const result = generateNumbers(forceRefresh);

  // Only auto-select if the setting is enabled
  if (result.predictions.length > 0 && state.generatorAutoSelect) {
    // Compare with last auto-selected numbers stored in state (not DOM)
    // DOM might be cleared by game after bet
    const lastSelected = state.lastAutoSelectedNumbers || [];

    // Sort both arrays for comparison
    const newNumbers = [...result.predictions].sort((a, b) => a - b);
    const oldNumbers = [...lastSelected].sort((a, b) => a - b);

    // Check if arrays are identical
    const numbersChanged = newNumbers.length !== oldNumbers.length ||
      newNumbers.some((num, idx) => num !== oldNumbers[idx]);

    if (numbersChanged) {
      // Store what we're about to select
      state.lastAutoSelectedNumbers = [...result.predictions];
      selectPredictedNumbers();
    }
  }
};

window.__keno_selectPredictedNumbers = selectPredictedNumbers;
window.__keno_generateAllPredictions = generateAllPredictions;
window.__keno_updateGeneratorPreview = updateGeneratorPreview;
