// src/numberSelection.js
// UI functions for selecting and displaying generated numbers

import { state } from '../core/state.js';
import { stateEvents, EVENTS } from '../core/stateEvents.js';
import { highlightPrediction } from '../utils/dom/heatmap.js';
import { generatorFactory, cacheManager } from '../generators/index.js';
import { replaceSelection } from '../utils/dom/tileSelection.js';
import { getIntValue } from '../utils/dom/domReader.js';
import { getDrawn } from '../storage/history.js';
import { COLORS } from './constants/colors.js';

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

  // NOTE: DOM elements may not exist in Preact version, but we still need to update state.nextNumbers
  // So we can't return early just because the container is missing

  const method = state.generatorMethod || 'frequency';
  const autoRefresh = state.generatorAutoRefresh;
  const interval = state.generatorInterval || 5;
  const currentRound = state.currentHistory?.length || 0;
  const lastRefresh = state.generatorLastRefresh || 0;

  // Update method label (if DOM exists)
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
    if (!autoRefresh) {
      roundsLabel.textContent = 'Manual';
      roundsLabel.style.color = COLORS.text.tertiary;
    } else {
      const roundsSinceRefresh = currentRound - lastRefresh;
      const roundsUntilRefresh = Math.max(0, interval - roundsSinceRefresh);
      roundsLabel.textContent = `${roundsUntilRefresh}/${interval} rounds`;
      roundsLabel.style.color = roundsUntilRefresh === 0 ? COLORS.accent.success : COLORS.accent.info;
    }
  }

  // Always show preview (even in manual mode)
  // Users can see what they'll get before clicking "Select These Numbers"

  // Generate preview of what NEXT numbers will be (force fresh generation)
  // This shows what you'd get if you clicked Refresh now
  let previewPredictions = [];
  const count = state.generatorCount || 3;
  const history = state.currentHistory || [];

  try {
    const config = buildGeneratorConfig(method);

    const generator = generatorFactory.get(method);
    if (generator) {
      // Generate fresh preview without updating cache
      previewPredictions = generator.generate(count, history, config);

      // Store in state for use by Refresh button
      state.nextNumbers = previewPredictions;

      // Emit event for listeners
      stateEvents.emit(EVENTS.GENERATOR_PREVIEW_UPDATED, previewPredictions);
    }
  } catch (e) {
    console.error('[Preview] Failed to generate preview:', e);
    state.nextNumbers = [];
    stateEvents.emit(EVENTS.GENERATOR_PREVIEW_UPDATED, []);
  }

  // Update preview numbers with hit/miss styling (only if DOM container exists)
  if (previewContainer) {
    if (previewPredictions.length === 0) {
      previewContainer.innerHTML = '<span style="color:#666; font-size:9px;">No predictions available</span>';
    } else {
      // Get drawn numbers from most recent round only
      const lastRoundDrawn = new Set();
      if (history.length > 0) {
        const lastRound = history[history.length - 1];
        const drawnNumbers = getDrawn(lastRound);

        if (drawnNumbers) {
          drawnNumbers.forEach(num => lastRoundDrawn.add(num));
        }
      }

      previewContainer.innerHTML = previewPredictions
        .map(num => {
          const wasHit = lastRoundDrawn.has(num);
          const baseStyle = 'display:inline-block; padding:4px 8px; border-radius:4px; font-size:10px; font-weight:600; transition: all 0.2s;';

          if (wasHit) {
            // Hit in last round - darker with inset shadow and different color
            return `<span style="${baseStyle} background:${COLORS.bg.darkest}; color:${COLORS.text.secondary}; box-shadow:inset 0 2px 4px rgba(0,0,0,0.6); border: 1px solid #0a1419;">${num}</span>`;
          } else {
            // Not hit - normal bright style
            return `<span style="${baseStyle} background:#2a3f4f; color:${COLORS.accent.info};">${num}</span>`;
          }
        })
        .join('');
    }
  }
}

/**
 * Generate predictions for all methods at once
 * Used for comparison tracking
 */
export function generateAllPredictions() {
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

  // Don't highlight after selection - game UI shows selected tiles
  // Highlights are only for hover preview of next numbers
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
 * Generates numbers WITHOUT selecting them (for preview regeneration)
 * @param {boolean} forceRefresh - Force cache bypass
 * @param {boolean} autoSelect - Whether to auto-select after generation (default: false)
 */
window.__keno_generateNumbers = async function (forceRefresh = false, autoSelect = false) {
  const result = generateNumbers(forceRefresh);

  // Only auto-select if explicitly requested (not when regenerating preview)
  if (autoSelect && result.predictions.length > 0) {
    await selectPredictedNumbers();
  }

  // Update preview to show new numbers
  if (window.__keno_updateGeneratorPreview) {
    window.__keno_updateGeneratorPreview();
  }

  return result;
};

window.__keno_selectPredictedNumbers = selectPredictedNumbers;
window.__keno_generateAllPredictions = generateAllPredictions;
window.__keno_updateGeneratorPreview = updateGeneratorPreview;
