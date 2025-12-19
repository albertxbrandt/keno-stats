// src/autoplay.js - REFACTORED
// Focused on auto-play betting logic only
// Generator logic delegated to src/generators/

import { state } from './state.js';
import { saveRound, getHits, getMisses } from './storage.js';
import { simulatePointerClick, findAndClickPlayButton, waitForBetButtonReady } from './utils.js';
import { highlightPrediction } from './heatmap.js';
import { generatorFactory, cacheManager } from './generators/index.js';

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

  const container = document.querySelector('div[data-testid="game-keno"]');
  if (!container) {
    console.error('[selectPredictedNumbers] Game container not found');
    return;
  }

  const tiles = Array.from(container.querySelectorAll('button'));
  console.log(`[selectPredictedNumbers] Selecting ${predictions.length} tiles:`, predictions);

  // Deselect all first
  deselectAllTiles(tiles);

  // Select predictions
  predictions.forEach(num => {
    const tile = tiles.find(t => {
      const text = (t.textContent || '').trim().split('%')[0];
      return parseInt(text) === num;
    });

    if (tile && !isTileSelected(tile)) {
      try {
        simulatePointerClick(tile);
      } catch (e) {
        try {
          tile.click();
        } catch (err) {
          console.error(`[selectPredictedNumbers] Failed to click tile ${num}:`, err);
        }
      }
    }
  });

  // Highlight predictions
  highlightPrediction(predictions);
}

/**
 * Deselect all tiles on game board
 */
function deselectAllTiles(tiles) {
  const selected = tiles.filter(isTileSelected);
  selected.forEach(tile => {
    try {
      simulatePointerClick(tile);
    } catch (e) {
      try {
        tile.click();
      } catch { }
    }
    // Clear highlight styles
    tile.style.boxShadow = '';
    tile.style.transform = '';
    tile.style.opacity = '1';
  });
}

/**
 * Check if tile is selected
 */
function isTileSelected(tile) {
  if (!tile) return false;
  const classList = Array.from(tile.classList);
  return classList.some(cls =>
    cls.includes('selected') ||
    cls.includes('active') ||
    cls.includes('picked') ||
    cls.includes('chosen')
  );
}

/**
 * Legacy prediction function (for old UI compatibility)
 */
export function calculatePrediction(countOverride) {
  const input = document.getElementById('predict-count');
  const count = parseInt((input && input.value) || countOverride) || 3;

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
// AUTO-PLAY BETTING LOGIC
// ============================================================================

/**
 * Place bet using current strategy
 */
export function autoPlayPlaceBet() {
  const container = document.querySelector('div[data-testid="game-keno"]');
  if (!container) {
    console.error('[AutoPlay] Game container not found');
    return;
  }

  const tiles = Array.from(container.querySelectorAll('button'));

  // Deselect currently selected
  deselectAllTiles(tiles);

  // Get predictions from unified generator or fallback
  let predictions = [];
  if (state.isGeneratorActive && state.generatedNumbers.length > 0) {
    predictions = state.generatedNumbers.slice(0, state.autoPlayPredictionCount);
    console.log('[AutoPlay] Using generated numbers:', predictions);
  } else {
    // Fallback to frequency-based predictions
    if (state.currentHistory.length === 0) {
      predictions = generateRandomPrediction(state.autoPlayPredictionCount);
    } else {
      predictions = getTopPredictions(state.autoPlayPredictionCount);
    }

    if (!predictions || predictions.length === 0) {
      predictions = generateRandomPrediction(state.autoPlayPredictionCount);
    }

    predictions = predictions.slice(0, state.autoPlayPredictionCount);
    console.log('[AutoPlay] Using fallback predictions:', predictions);
  }

  // Select tiles
  predictions.forEach(num => {
    const tile = tiles.find(t => {
      const text = (t.textContent || '').trim().split('%')[0];
      return parseInt(text) === num;
    });

    if (tile && !isTileSelected(tile)) {
      try {
        simulatePointerClick(tile);
      } catch (e) {
        try {
          tile.click();
        } catch { }
      }
    }
  });

  // Click play button
  setTimeout(() => {
    const playBtn = findAndClickPlayButton();
    if (!playBtn) {
      console.error('[AutoPlay] Play button not found');
      state.isAutoPlayMode = false;
      updateAutoPlayUI();
    }
  }, 500);
}

/**
 * Generate random predictions (fallback)
 */
export function generateRandomPrediction(count) {
  const predictions = [];
  const available = Array.from({ length: 40 }, (_, i) => i + 1);
  const capped = Math.min(count, 40);

  for (let i = 0; i < capped; i++) {
    const idx = Math.floor(Math.random() * available.length);
    predictions.push(available[idx]);
    available.splice(idx, 1);
  }

  return predictions.sort((a, b) => a - b);
}

/**
 * Update auto-play UI elements
 */
export function updateAutoPlayUI() {
  const apStatus = document.getElementById('autoplay-status');
  const apBtn = document.getElementById('autoplay-btn');
  const timerDiv = document.getElementById('autoplay-timer');
  const timerValue = document.getElementById('autoplay-timer-value');

  if (apStatus) {
    if (state.isAutoPlayMode) {
      apStatus.innerText = `Playing: ${state.autoPlayRoundsRemaining}`;
      apStatus.style.color = '#74b9ff';
    } else {
      if (state.autoPlayElapsedTime > 0) {
        const mins = Math.floor(state.autoPlayElapsedTime / 60);
        const secs = state.autoPlayElapsedTime % 60;
        apStatus.innerText = `Done (${mins}:${secs.toString().padStart(2, '0')})`;
        apStatus.style.color = '#00b894';
      } else {
        apStatus.innerText = 'Ready';
        apStatus.style.color = '#aaa';
      }
    }
  }

  if (apBtn) {
    apBtn.innerText = state.isAutoPlayMode ? 'Stop' : 'Play';
    apBtn.style.backgroundColor = state.isAutoPlayMode ? '#ff7675' : '#00b894';
  }

  if (timerDiv) {
    if (state.isAutoPlayMode) {
      timerDiv.style.display = 'block';
      if (state.autoPlayStartTime && timerValue) {
        const elapsed = Math.floor((Date.now() - state.autoPlayStartTime) / 1000);
        const mins = Math.floor(elapsed / 60);
        const secs = elapsed % 60;
        timerValue.innerText = `${mins}:${secs.toString().padStart(2, '0')}`;
      }
    } else {
      timerDiv.style.display = 'none';
    }
  }
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
