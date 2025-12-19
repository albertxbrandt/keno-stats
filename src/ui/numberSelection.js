// src/numberSelection.js
// UI functions for selecting and displaying generated numbers

import { state } from '../core/state.js';
import { getHits, getMisses } from '../core/storage.js';
import { highlightPrediction } from '../features/heatmap.js';
import { generatorFactory, cacheManager } from '../generators/index.js';
import { replaceSelection } from '../utils/tileSelection.js';
import { getSelectedTileNumbers } from '../utils/domReader.js';

// ============================================================================
// GENERATOR WRAPPER FUNCTIONS (for backward compatibility)
// These delegate to the new generator system
// ============================================================================

/**
 * Update the preview UI to show next predicted numbers and refresh countdown
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
  
  console.log('[Preview] Showing next numbers:', previewPredictions, 'Method:', method, 'Interval:', interval);

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

  console.log(`[generateNumbers] Generating ${method} predictions (count: ${count})`);
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
export async function selectPredictedNumbers() {
  const predictions = state.generatedNumbers || [];
  if (predictions.length === 0) {
    console.warn('[selectPredictedNumbers] No predictions available');
    return;
  }

  console.log(`[selectPredictedNumbers] state.generatedNumbers:`, state.generatedNumbers);
  console.log(`[selectPredictedNumbers] Selecting ${predictions.length} tiles:`, predictions);

  // Use shared tile selection utility (now async)
  const result = await replaceSelection(predictions);
  if (result.failed.length > 0) {
    console.warn('[selectPredictedNumbers] Failed to select tiles:', result.failed);
  }

  // Highlight predictions
  console.log(`[selectPredictedNumbers] About to highlight:`, predictions);
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

// ============================================================================
// WINDOW HOOKS (for cross-module calls from HTML event handlers)
// ============================================================================

/**
 * Window hook wrapper for generateNumbers
 * Generates numbers and selects them on the board (only if auto-select is enabled)
 */
window.__keno_generateNumbers = function (forceRefresh = false) {
  console.log(`[__keno_generateNumbers] Called with forceRefresh=${forceRefresh}, autoSelect=${state.generatorAutoSelect}`);
  const result = generateNumbers(forceRefresh);
  console.log(`[__keno_generateNumbers] Result:`, result);

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
      console.log(`[__keno_generateNumbers] Numbers changed, auto-selecting ${result.predictions.length} numbers`);
      console.log(`[__keno_generateNumbers] Old:`, oldNumbers, 'New:', newNumbers);

      // Store what we're about to select
      state.lastAutoSelectedNumbers = [...result.predictions];
      selectPredictedNumbers();
    } else {
      console.log(`[__keno_generateNumbers] Numbers unchanged (${newNumbers.join(', ')}), skipping re-selection`);
    }
  } else if (result.predictions.length > 0) {
    console.log(`[__keno_generateNumbers] Generated but auto-select is OFF`);
  }
};

window.__keno_selectPredictedNumbers = selectPredictedNumbers;
window.__keno_updateMomentumPredictions = updateMomentumPredictions;
window.__keno_selectMomentumNumbers = selectMomentumNumbers;
window.__keno_generateAllPredictions = generateAllPredictions;
window.__keno_updateGeneratorPreview = updateGeneratorPreview;
