// src/autoplay.js
import { state } from './state.js';
import { saveRound, getHits, getMisses } from './storage.js';
import { simulatePointerClick, findAndClickPlayButton, waitForPlayButtonAndClick, waitForClearButtonAndClick } from './utils.js';
import { highlightPrediction } from './heatmap.js';
import { getMomentumPrediction, MomentumPatternGenerator } from './momentum.js';

/**
 * Unified Number Generator - generates numbers based on selected method
 * This replaces separate predict and momentum functions
 */
export function generateNumbers() {
    if (!state.isGeneratorActive) {
        console.log('[Generator] Generator not active');
        return [];
    }

    const container = document.querySelector('div[data-testid="game-keno"]');
    if (!container) {
        console.log('[Generator] Keno board not found');
        return [];
    }

    let generatedNumbers = [];

    // Generate numbers based on selected method
    if (state.generatorMethod === 'frequency') {
        const count = state.generatorCount || 3;
        generatedNumbers = getTopPredictions(count);
        console.log(`[Generator] Frequency method generated ${generatedNumbers.length} numbers:`, generatedNumbers);
    } else if (state.generatorMethod === 'momentum') {
        const config = getMomentumConfig();
        generatedNumbers = getMomentumPrediction(config.patternSize, config);
        state.momentumLastRefresh = state.currentHistory.length;
        console.log(`[Generator] Momentum method generated ${generatedNumbers.length} numbers:`, generatedNumbers);

        // Log top numbers with momentum values
        logTopMomentumNumbers(config);

        // Update countdown display
        if (window.__keno_updateMomentumCountdown) {
            window.__keno_updateMomentumCountdown();
        }
    }

    // Store generated numbers
    state.generatedNumbers = generatedNumbers;

    // Update legacy state for backward compatibility
    if (state.generatorMethod === 'frequency') {
        state.predictedNumbers = generatedNumbers;
    } else if (state.generatorMethod === 'momentum') {
        state.momentumNumbers = generatedNumbers;
    }

    // Highlight the generated numbers
    highlightPrediction(generatedNumbers);

    // Auto-select if enabled
    if (state.generatorAutoSelect) {
        console.log('[Generator] Auto-selecting numbers on board (delayed)');
        setTimeout(() => {
            selectGeneratedNumbers(generatedNumbers);
        }, 800);
    }

    return generatedNumbers;
}

/**
 * Select generated numbers on the board
 */
function selectGeneratedNumbers(numbers) {
    const container = document.querySelector('div[data-testid="game-keno"]');
    if (!container || !numbers || numbers.length === 0) {
        console.log('[Generator] Cannot select - board not found or no numbers');
        return;
    }

    const tiles = Array.from(container.querySelectorAll('button'));
    const numToTile = {};
    tiles.forEach(tile => {
        const numText = (tile.textContent || '').trim();
        const num = parseInt(numText.split('%')[0]);
        if (!isNaN(num)) numToTile[num] = tile;
    });

    // Clear board first
    const clearButton = document.querySelector('button[data-testid="game-clear-table"]');
    if (clearButton) {
        try {
            simulatePointerClick(clearButton);
        } catch (e) {
            try {
                clearButton.click();
            } catch (err) {
                console.error('[Generator] Failed to click clear button', err);
            }
        }
    }

    // Select numbers (delay to allow clear to complete)
    setTimeout(() => {
        let selectedCount = 0;
        numbers.forEach(num => {
            const tile = numToTile[num];
            if (!tile) return;

            try {
                simulatePointerClick(tile);
                selectedCount++;
            } catch (e) {
                try {
                    tile.click();
                    selectedCount++;
                } catch (err) {
                    console.error('[Generator] Failed to click tile', num, err);
                }
            }
        });

        console.log(`[Generator] Selected ${selectedCount} numbers on board:`, numbers);
    }, 500);
}

export function selectPredictedNumbers() {
    if (!state.isPredictMode || state.predictedNumbers.length === 0) {
        console.log('[Keyboard] Predict mode not active or no predictions');
        return;
    }

    const container = document.querySelector('div[data-testid="game-keno"]');
    if (!container) {
        console.log('[Keyboard] Keno board not found');
        return;
    }

    const tiles = Array.from(container.querySelectorAll('button'));
    const numToTile = {};

    tiles.forEach(tile => {
        const numText = (tile.textContent || '').trim();
        const num = parseInt(numText.split('%')[0]);
        if (!isNaN(num)) numToTile[num] = tile;
    });

    // First, clear the board using the clear button
    const clearButton = document.querySelector('button[data-testid="game-clear-table"]');
    if (clearButton) {
        console.log('[Keyboard] Clearing board using clear button');
        try {
            simulatePointerClick(clearButton);
        } catch (e) {
            try {
                clearButton.click();
            } catch (err) {
                console.error('[Keyboard] Failed to click clear button', err);
            }
        }
    }

    // Wait for DOM to update before selecting predicted numbers
    setTimeout(() => {
        let selectedCount = 0;
        state.predictedNumbers.forEach(num => {
            const tile = numToTile[num];
            if (!tile) return;

            try {
                simulatePointerClick(tile);
                selectedCount++;
            } catch (e) {
                try {
                    tile.click();
                    selectedCount++;
                } catch (err) {
                    console.error('[Keyboard] Failed to click tile', num, err);
                }
            }
        });

        console.log(`[Keyboard] Selected ${selectedCount} predicted numbers:`, state.predictedNumbers);
    }, 50);
}

function isTileSelected(tile) {
    try {
        const ariaPressed = tile.getAttribute('aria-pressed');
        if (ariaPressed === 'true') return true;
        const ariaChecked = tile.getAttribute('aria-checked');
        if (ariaChecked === 'true') return true;
        const className = (tile.className || '').toString();
        if (/\bselected\b|\bactive\b|\bis-active\b|\bpicked\b|\bchosen\b/i.test(className)) return true;
        if (tile.dataset && (tile.dataset.selected === 'true' || tile.dataset.active === 'true')) return true;
    } catch (e) { }
    return false;
}

export function getTopPredictions(count) {
    const counts = {};
    const sampleCount = Math.min(state.generatorSampleSize, state.currentHistory.length);
    let sample = state.currentHistory.slice(-sampleCount);
    sample.forEach(round => {
        const hits = getHits(round);
        const misses = getMisses(round);
        const allHits = [...hits, ...misses];
        allHits.forEach(num => { counts[num] = (counts[num] || 0) + 1; });
    });
    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    const capped = Math.min(count, 40);
    return sorted.slice(0, capped).map(entry => parseInt(entry[0]));
}

export function getMomentumBasedPredictions(count) {
    try {
        // Use momentum generator with configurable settings
        const config = {
            detectionWindow: 5,
            baselineWindow: 50,
            momentumThreshold: 1.5,
            refreshFrequency: 5,
            topNPool: 15
        };
        return getMomentumPrediction(count, config);
    } catch (e) {
        console.error('[AutoPlay] Momentum prediction failed:', e);
        // Fallback to frequency-based
        return getTopPredictions(count);
    }
}

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

export function calculatePrediction(countOverride) {
    const input = document.getElementById('predict-count');
    const count = parseInt((input && input.value) || countOverride) || 3;
    if (state.currentHistory.length === 0) {
        state.predictedNumbers = [];
        return [];
    }
    const counts = {};
    const sampleCount = Math.min(state.sampleSize, state.currentHistory.length);
    let sample = state.currentHistory.slice(-sampleCount);
    sample.forEach(round => {
        const hits = getHits(round);
        const misses = getMisses(round);
        const allHits = [...hits, ...misses];
        allHits.forEach(num => { counts[num] = (counts[num] || 0) + 1; });
    });
    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    const topPicks = sorted.slice(0, count).map(entry => parseInt(entry[0]));
    state.predictedNumbers = topPicks;
    highlightPrediction(topPicks);
    return topPicks;
}

export function autoPlayPlaceBet() {
    const container = document.querySelector('div[data-testid="game-keno"]');
    if (!container) {
        console.warn('[AutoPlay] Keno container not found');
        return;
    }
    
    console.log('[AutoPlay] Starting bet placement - waiting for clear button');
    
    // Wait for clear button to be ready, then click it
    waitForClearButtonAndClick(3000, 50).then(clearSuccess => {
        if (!clearSuccess) {
            console.warn('[AutoPlay] Clear button failed - trying manual deselect');
            // Fallback: manually deselect all tiles
            const tiles = Array.from(container.querySelectorAll('button'));
            const selected = tiles.filter(isTileSelected);
            selected.forEach(tile => {
                try {
                    tile.click();
                } catch (e) {
                    console.error('[AutoPlay] Manual deselect failed', e);
                }
            });
        } else {
            console.log('[AutoPlay] Board cleared successfully');
        }
        
        // Wait for clear to complete, then generate predictions
        setTimeout(() => {
            generateAndSelectPredictions();
        }, 300);
    });
}

function generateAndSelectPredictions() {
    // Regenerate predictions based on latest history
    let predictions = [];
    if (state.isGeneratorActive) {
        // Regenerate numbers using the generator (will recalculate with latest data)
        if (state.generatorMethod === 'frequency') {
            predictions = getTopPredictions(state.autoPlayPredictionCount);
        } else if (state.generatorMethod === 'momentum') {
            const config = getMomentumConfig();
            predictions = getMomentumPrediction(config.patternSize, config);
        }
        state.generatedNumbers = predictions;
        console.log('[AutoPlay] Regenerated predictions from Number Generator:', predictions);
    } else {
        // Fallback to frequency-based predictions
        if (state.currentHistory.length === 0) predictions = generateRandomPrediction(state.autoPlayPredictionCount);
        else predictions = getTopPredictions(state.autoPlayPredictionCount);
        if (!predictions || predictions.length === 0) predictions = generateRandomPrediction(state.autoPlayPredictionCount);
        predictions = predictions.slice(0, state.autoPlayPredictionCount);
        console.log('[AutoPlay] Generated fallback predictions:', predictions);
    }

    highlightPrediction(predictions);
    selectAndPlayPredictions(predictions);
}

function selectAndPlayPredictions(predictions) {
    const container = document.querySelector('div[data-testid="game-keno"]');
    if (!container) return;
    
    const tiles = Array.from(container.querySelectorAll('button'));
    setTimeout(() => {
        const clicked = [];
        const numToTile = {};
        tiles.forEach(tile => { const numText = (tile.textContent || '').trim(); const num = parseInt(numText.split('%')[0]); if (!isNaN(num)) numToTile[num] = tile; });
        const uniquePreds = [...new Set(predictions)].slice(0, state.autoPlayPredictionCount);
        uniquePreds.forEach(num => {
            const tile = numToTile[num];
            if (!tile) return;
            if (!isTileSelected(tile)) simulatePointerClick(tile);
            else { tile.style.boxShadow = "inset 0 0 0 4px #74b9ff"; tile.style.transform = "scale(1.05)"; }
            clicked.push(num);
        });
        if (clicked.length < state.autoPlayPredictionCount) {
            const needed = state.autoPlayPredictionCount - clicked.length;
            const availableNums = Object.keys(numToTile).map(n => parseInt(n)).filter(n => !clicked.includes(n));
            for (let i = 0; i < needed && availableNums.length > 0; i++) {
                const idx = Math.floor(Math.random() * availableNums.length);
                const pick = availableNums.splice(idx, 1)[0];
                const tile = numToTile[pick]; if (tile) { simulatePointerClick(tile); clicked.push(pick); }
            }
        }
        tiles.forEach(tile => { const numText = (tile.textContent || '').trim(); const num = parseInt(numText.split('%')[0]); if (isNaN(num)) return; if (!clicked.includes(num)) tile.style.opacity = '0.4'; });
        console.log('[AutoPlay] Clicked predicted tiles (final):', clicked);
        
        // Wait for play button to become enabled, then click it
        waitForPlayButtonAndClick(10000, 100).then(success => {
            if (success) {
                console.log('[AutoPlay] Play button clicked successfully');
            } else {
                console.warn('[AutoPlay] Failed to click play button - timed out waiting');
            }
        });
    }, 350);
}

/**
 * Get momentum config from UI inputs
 */
function getMomentumConfig() {
    const refreshInput = document.getElementById('momentum-refresh');
    const detectionInput = document.getElementById('momentum-detection');
    const baselineInput = document.getElementById('momentum-baseline');
    const thresholdInput = document.getElementById('momentum-threshold');
    const poolInput = document.getElementById('momentum-pool');

    return {
        patternSize: state.generatorCount || 10, // Use unified count
        detectionWindow: parseInt(detectionInput?.value) || 5,
        baselineWindow: parseInt(baselineInput?.value) || 50,
        momentumThreshold: parseFloat(thresholdInput?.value) || 1.5,
        refreshFrequency: parseInt(refreshInput?.value) || 5,
        topNPool: parseInt(poolInput?.value) || 15
    };
}

/**
 * Check if momentum should refresh based on round count
 */
function shouldRefreshMomentum() {
    if (!state.isMomentumMode) return false;

    const config = getMomentumConfig();
    const currentRound = state.currentHistory.length;

    // First time or refresh interval reached
    if (state.momentumLastRefresh === 0) return true;

    const roundsSinceRefresh = currentRound - state.momentumLastRefresh;
    return roundsSinceRefresh >= config.refreshFrequency;
}

/**
 * Update countdown display showing rounds until next refresh
 */
function updateMomentumCountdown() {
    const countdownEl = document.getElementById('momentum-countdown');
    const infoPanel = document.getElementById('momentum-info');
    const currentNumbersEl = document.getElementById('momentum-current-numbers');

    if (!state.isMomentumMode) {
        if (infoPanel) infoPanel.style.display = 'none';
        return;
    }

    // Show info panel when momentum is active
    if (infoPanel) infoPanel.style.display = 'block';

    const config = getMomentumConfig();
    const currentRound = state.currentHistory.length;

    // Update countdown
    if (countdownEl) {
        if (state.momentumLastRefresh === 0) {
            countdownEl.textContent = 'Waiting...';
        } else {
            const roundsSinceRefresh = currentRound - state.momentumLastRefresh;
            const roundsRemaining = config.refreshFrequency - roundsSinceRefresh;

            if (roundsRemaining > 0) {
                countdownEl.textContent = `${roundsRemaining} round${roundsRemaining === 1 ? '' : 's'}`;
            } else {
                countdownEl.textContent = 'Refreshing...';
            }
        }
    }

    // Update momentum values display (only calculate if numbers changed)
    if (currentNumbersEl) {
        if (state.momentumNumbers && state.momentumNumbers.length > 0 && state.currentHistory.length > 0) {
            // Cache momentum display to avoid recalculating every countdown update
            if (!state.momentumDisplayCache || state.momentumDisplayCache.round !== state.momentumLastRefresh) {
                try {
                    const generator = new MomentumPatternGenerator({
                        patternSize: config.patternSize,
                        ...config
                    });

                    // Get momentum values for current selected numbers
                    const momentumValues = state.momentumNumbers.map(num => {
                        const momentum = generator.calculateMomentum(num, state.currentHistory);
                        const value = momentum !== null ? momentum.toFixed(2) : 'N/A';
                        return `${num}:${value}`;
                    }).join(', ');

                    state.momentumDisplayCache = {
                        round: state.momentumLastRefresh,
                        display: momentumValues
                    };
                } catch (e) {
                    state.momentumDisplayCache = {
                        round: state.momentumLastRefresh,
                        display: state.momentumNumbers.join(', ')
                    };
                }
            }
            currentNumbersEl.textContent = state.momentumDisplayCache.display;
        } else {
            currentNumbersEl.textContent = 'None';
        }
    }
}

/**
 * Log top momentum numbers with their momentum values
 */
function logTopMomentumNumbers(config) {
    try {
        const generator = new MomentumPatternGenerator({
            patternSize: config.patternSize,
            ...config
        });

        const allMomentum = generator.getAllMomentumValues(state.currentHistory);
        const topNumbers = allMomentum.slice(0, 15); // Show top 15

        console.log(`[Momentum] Top ${topNumbers.length} numbers by momentum:`);
        topNumbers.forEach((item, index) => {
            const momentumValue = item.momentum !== null ? item.momentum.toFixed(2) : 'N/A';
            const hotIndicator = item.isHot ? '🔥' : '  ';
            console.log(`  ${hotIndicator} ${index + 1}. Number ${item.number}: ${momentumValue}`);
        });
    } catch (e) {
        console.error('[Momentum] Failed to log top numbers:', e);
    }
}

/**
 * Update momentum predictions (called automatically on new rounds)
 */
export function updateMomentumPredictions() {
    if (!state.isMomentumMode) return;
    if (!shouldRefreshMomentum()) {
        // Update countdown even if not refreshing
        updateMomentumCountdown();
        return;
    }

    const config = getMomentumConfig();

    try {
        const momentumNums = getMomentumPrediction(config.patternSize, config);
        state.momentumNumbers = momentumNums;
        state.momentumLastRefresh = state.currentHistory.length;

        // Log top numbers with detailed info
        logTopMomentumNumbers(config);
        console.log(`[Momentum] Auto-refreshed at round ${state.momentumLastRefresh}:`, momentumNums);

        // Update status display
        const momentumStatus = document.getElementById('momentum-status');
        if (momentumStatus) {
            momentumStatus.textContent = `Updated (${momentumNums.length})`;
        }

        // Update countdown
        updateMomentumCountdown();

        // Auto-select if toggle is enabled, otherwise just highlight
        if (state.momentumAutoSelect) {
            console.log('[Momentum] Auto-selecting numbers on board (delayed)');
            // Delay to allow UI to fully update after round completion
            setTimeout(() => {
                selectMomentumNumbers();
            }, 800);
        } else {
            // Just highlight the new predictions
            highlightPrediction(momentumNums);
        }
    } catch (e) {
        console.error('[Momentum] Auto-update failed:', e);
    }
}

/**
 * Select momentum-based numbers on the board (manual mode)
 * User enables momentum mode, clicks "Select Numbers", then plays manually
 */
export function selectMomentumNumbers() {
    if (!state.isMomentumMode) {
        console.log('[Momentum] Momentum mode not active');
        return;
    }

    const container = document.querySelector('div[data-testid="game-keno"]');
    if (!container) {
        console.log('[Momentum] Keno board not found');
        return;
    }

    // Get config from UI
    const config = getMomentumConfig();

    // Generate momentum predictions
    let momentumNums = [];
    try {
        momentumNums = getMomentumPrediction(config.patternSize, config);
        state.momentumNumbers = momentumNums;
        state.momentumLastRefresh = state.currentHistory.length;
        console.log('[Momentum] Generated predictions:', momentumNums);
    } catch (e) {
        console.error('[Momentum] Failed to generate predictions:', e);
        return;
    }

    if (momentumNums.length === 0) {
        console.warn('[Momentum] No momentum numbers found');
        return;
    }

    // Update status
    const momentumStatus = document.getElementById('momentum-status');
    if (momentumStatus) {
        momentumStatus.textContent = `Selected (${momentumNums.length})`;
    }

    // Update countdown display
    updateMomentumCountdown();

    // Get tile mapping
    const tiles = Array.from(container.querySelectorAll('button'));
    const numToTile = {};
    tiles.forEach(tile => {
        const numText = (tile.textContent || '').trim();
        const num = parseInt(numText.split('%')[0]);
        if (!isNaN(num)) numToTile[num] = tile;
    });

    // Clear board first
    const clearButton = document.querySelector('button[data-testid="game-clear-table"]');
    if (clearButton) {
        try {
            simulatePointerClick(clearButton);
        } catch (e) {
            try {
                clearButton.click();
            } catch (err) {
                console.error('[Momentum] Failed to click clear button', err);
            }
        }
    }

    // Select momentum numbers (delay to allow clear to complete)
    setTimeout(() => {
        let selectedCount = 0;
        momentumNums.forEach(num => {
            const tile = numToTile[num];
            if (!tile) return;

            try {
                simulatePointerClick(tile);
                selectedCount++;
            } catch (e) {
                try {
                    tile.click();
                    selectedCount++;
                } catch (err) {
                    console.error('[Momentum] Failed to click tile', num, err);
                }
            }
        });

        console.log(`[Momentum] Selected ${selectedCount} momentum numbers:`, momentumNums);

        // Highlight the selected numbers
        highlightPrediction(momentumNums);
    }, 500);
}

// Expose functions for UI
window.__keno_generateNumbers = generateNumbers; // New unified generator
window.__keno_calculatePrediction = calculatePrediction; // Legacy
window.__keno_selectMomentumNumbers = selectMomentumNumbers; // Legacy
window.__keno_updateMomentumPredictions = updateMomentumPredictions;
window.__keno_updateMomentumCountdown = updateMomentumCountdown;
