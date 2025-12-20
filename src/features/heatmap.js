// src/features/heatmap.js
import { state } from '../core/state.js';
import { getHits, getMisses } from '../core/storage.js';
import { getTileElements, extractNumberFromTile } from '../utils/domReader.js';

// ==================== CONSTANTS ====================

const SELECTORS = {
    STAT_BOX: '.keno-stat-box'
};

const COLORS = {
    HIT: '#00b894',
    MISS: '#ff7675',
    PREDICTION: '#74b9ff',
    NEUTRAL: 'rgba(255,255,255,0.7)'
};

const THRESHOLDS = {
    TRENDING: {
        HOT: 1.2,      // 20%+ increase
        COLD: 0.8      // 20%+ decrease
    },
    HOT_MODE: {
        HOT: 40,
        COLD: 0
    },
    DEFAULT: {
        HOT: 30,
        COLD: 10
    }
};

const TRENDING_CONFIG = {
    RECENT_WINDOW_RATIO: 0.25,  // 25% of sample
    MIN_RECENT_WINDOW: 5,        // Minimum games in recent window
    MIN_BASELINE_WINDOW: 5,      // Minimum games in baseline
    MIN_BASELINE_RATE: 0.01      // Avoid division by zero
};

const KENO_NUMBERS = {
    MIN: 1,
    MAX: 40
};

// ==================== HELPER FUNCTIONS ====================

/**
 * Get all drawn numbers from a round
 * @param {Object} round - Round data
 * @returns {number[]}
 */
function getDrawnNumbers(round) {
    const hits = getHits(round);
    const misses = getMisses(round);
    return [...hits, ...misses];
}

/**
 * Count number frequencies in sample
 * @param {Array} sample - Round history sample
 * @returns {Object} Frequency counts by number
 */
function countFrequencies(sample) {
    const counts = {};
    sample.forEach(round => {
        const drawnNumbers = getDrawnNumbers(round);
        drawnNumbers.forEach(num => {
            counts[num] = (counts[num] || 0) + 1;
        });
    });
    return counts;
}

/**
 * Calculate momentum ratios for trending mode
 * @param {Array} sample - Round history sample
 * @param {number} sampleCount - Total sample size
 * @returns {Object} Momentum ratios by number
 */
function calculateMomentum(sample, sampleCount) {
    const recentWindow = Math.floor(sampleCount * TRENDING_CONFIG.RECENT_WINDOW_RATIO) || TRENDING_CONFIG.MIN_RECENT_WINDOW;
    const baselineWindow = sampleCount - recentWindow;

    // Fallback to frequency if insufficient data
    if (baselineWindow < TRENDING_CONFIG.MIN_BASELINE_WINDOW) {
        return countFrequencies(sample);
    }

    const recentSample = sample.slice(-recentWindow);
    const baselineSample = sample.slice(0, baselineWindow);

    const recentCounts = countFrequencies(recentSample);
    const baselineCounts = countFrequencies(baselineSample);

    const momentum = {};
    for (let num = KENO_NUMBERS.MIN; num <= KENO_NUMBERS.MAX; num++) {
        const recentRate = (recentCounts[num] || 0) / recentWindow;
        const baselineRate = (baselineCounts[num] || TRENDING_CONFIG.MIN_BASELINE_RATE) / baselineWindow;
        momentum[num] = recentRate / baselineRate;
    }

    return momentum;
}

/**
 * Calculate statistics for heatmap
 * @param {Array} sample - Round history sample
 * @param {string} mode - 'hot' or 'trending'
 * @returns {Object} Statistics by number
 */
function calculateHeatmapStats(sample, mode) {
    const sampleCount = sample.length;

    if (mode === 'trending') {
        return calculateMomentum(sample, sampleCount);
    }

    return countFrequencies(sample);
}

/**
 * Format display text based on mode
 * @param {number} value - Raw statistic value
 * @param {string} mode - 'hot' or 'trending'
 * @param {number} totalGames - Total games in sample
 * @returns {Object} { displayText, percentValue }
 */
function formatDisplayValue(value, mode, totalGames) {
    if (mode === 'trending') {
        return {
            displayText: `${value.toFixed(1)}x`,
            percentValue: null
        };
    }

    const percent = ((value / totalGames) * 100).toFixed(0);
    return {
        displayText: `${percent}%`,
        percentValue: parseInt(percent)
    };
}

/**
 * Get color based on value and mode thresholds
 * @param {number} value - Statistic value
 * @param {number|null} percentValue - Percentage value (for hot mode)
 * @param {string} mode - 'hot' or 'trending'
 * @returns {string} CSS color
 */
function getColorForValue(value, percentValue, mode) {
    if (mode === 'trending') {
        if (value >= THRESHOLDS.TRENDING.HOT) return COLORS.HIT;
        if (value <= THRESHOLDS.TRENDING.COLD) return COLORS.MISS;
        return COLORS.NEUTRAL;
    }

    const thresholds = state.isHotMode ? THRESHOLDS.HOT_MODE : THRESHOLDS.DEFAULT;
    if (percentValue >= thresholds.HOT) return COLORS.HIT;
    if (percentValue <= thresholds.COLD) return COLORS.MISS;
    return COLORS.NEUTRAL;
}

/**
 * Create or update stat box element on tile
 * @param {HTMLElement} tile - Tile element
 * @param {string} text - Display text
 * @param {string} color - Text color
 */
function updateStatBox(tile, text, color) {
    let statBox = tile.querySelector(SELECTORS.STAT_BOX);

    if (!statBox) {
        statBox = document.createElement('div');
        statBox.className = 'keno-stat-box';
        Object.assign(statBox.style, {
            position: 'absolute',
            bottom: '2px',
            right: '2px',
            fontSize: '12px',
            padding: '2px 4px',
            fontWeight: 'bold',
            color: COLORS.NEUTRAL,
            backgroundColor: 'rgba(0,0,0,0.7)',
            borderRadius: '4px',
            pointerEvents: 'none'
        });
        tile.style.position = 'relative';
        tile.appendChild(statBox);
    }

    statBox.innerText = text;
    statBox.style.color = color;
}

/**
 * Apply tile styles for round highlighting
 * @param {HTMLElement} tile - Tile element
 * @param {string} type - 'hit', 'miss', or 'none'
 */
function applyRoundHighlight(tile, type) {
    const styles = {
        hit: {
            boxShadow: `inset 0 0 0 4px ${COLORS.HIT}`,
            transition: 'box-shadow 0.1s',
            transform: 'scale(1.05)',
            zIndex: '10'
        },
        miss: {
            boxShadow: `inset 0 0 0 4px ${COLORS.MISS}`,
            transition: 'box-shadow 0.1s'
        },
        none: {
            opacity: state.isPredictMode ? '1' : '0.3'
        }
    };

    if (!state.isPredictMode) {
        tile.style.boxShadow = '';
        tile.style.transform = '';
    }

    Object.assign(tile.style, styles[type] || {});
}

/**
 * Apply tile styles for prediction highlighting
 * @param {HTMLElement} tile - Tile element
 * @param {boolean} isPredicted - Whether this tile is in prediction
 */
function applyPredictionHighlight(tile, isPredicted) {
    if (isPredicted) {
        tile.style.boxShadow = `inset 0 0 0 4px ${COLORS.PREDICTION}, 0 0 15px ${COLORS.PREDICTION}`;
        tile.style.transform = 'scale(1.1)';
        tile.style.zIndex = '20';
        tile.style.borderColor = COLORS.PREDICTION;
    } else {
        tile.style.opacity = '0.4';
    }
}

/**
 * Reset all tile styles
 * @param {HTMLElement} tile - Tile element
 */
function resetTileStyles(tile) {
    tile.style.boxShadow = '';
    tile.style.opacity = '1';
    tile.style.transform = '';
    tile.style.borderColor = '';
    tile.style.zIndex = '';
}

// ==================== PUBLIC API ====================

/**
 * Highlight tiles for a specific round
 * @param {Object} round - Round data with hits and misses
 */
export function highlightRound(round) {
    const tiles = getTileElements();
    if (!tiles) return;

    const hits = getHits(round);
    const misses = getMisses(round);

    tiles.forEach(tile => {
        const num = extractNumberFromTile(tile.textContent);
        if (isNaN(num)) return;

        if (hits.includes(num)) {
            applyRoundHighlight(tile, 'hit');
        } else if (misses.includes(num)) {
            applyRoundHighlight(tile, 'miss');
        } else {
            applyRoundHighlight(tile, 'none');
        }
    });
}

/**
 * Highlight predicted numbers
 * @param {number[]} numbers - Array of predicted numbers
 */
export function highlightPrediction(numbers) {
    const tiles = getTileElements();
    if (!tiles) return;

    // Reset all tiles first
    tiles.forEach(resetTileStyles);

    // Apply prediction highlights
    tiles.forEach(tile => {
        const num = extractNumberFromTile(tile.textContent);
        if (isNaN(num)) return;

        applyPredictionHighlight(tile, numbers.includes(num));
    });
}

/**
 * Clear all highlights and restore to default state
 */
export function clearHighlight() {
    if (state.isPredictMode && window.__keno_calculatePrediction) {
        window.__keno_calculatePrediction();
        return;
    }

    const tiles = getTileElements();
    if (!tiles) return;

    tiles.forEach(resetTileStyles);
}

/**
 * Update heatmap display with current statistics
 */
export function updateHeatmap() {
    // Early validation checks
    if (!window.location.href.includes('keno')) return;
    if (state.currentHistory.length === 0) return;
    if (!state.isHeatmapActive) return;
    if (!state.panelVisibility?.heatmap) return;

    // Get sample data
    const sampleCount = Math.min(state.heatmapSampleSize, state.currentHistory.length);
    const sample = state.currentHistory.slice(-sampleCount);
    if (sample.length === 0) return;

    // Calculate statistics
    const stats = calculateHeatmapStats(sample, state.heatmapMode);

    // Update tiles
    const tiles = getTileElements();
    if (!tiles) return;

    tiles.forEach(tile => {
        const num = extractNumberFromTile(tile.textContent);
        if (isNaN(num)) return;

        const value = stats[num] || 0;
        const { displayText, percentValue } = formatDisplayValue(value, state.heatmapMode, sample.length);
        const color = getColorForValue(value, percentValue, state.heatmapMode);

        updateStatBox(tile, displayText, color);
    });
}

// Expose to window for cross-module callbacks in storage UI
window.__keno_highlightRound = highlightRound;
window.__keno_clearHighlight = clearHighlight;
window.__keno_updateHeatmap = updateHeatmap;

// Note: updateHeatmap is called on-demand via storage.js saveRound() callback
// No longer running on interval to improve performance with large datasets

