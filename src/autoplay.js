// src/autoplay.js
import { state } from './state.js';
import { saveRound, getHits, getMisses } from './storage.js';
import { simulatePointerClick, findAndClickPlayButton, waitForBetButtonReady } from './utils.js';
import { highlightPrediction } from './heatmap.js';
import { getMomentumPrediction, MomentumPatternGenerator } from './momentum.js';
import { getShapePredictions } from './shapes.js';

/**
 * Generate predictions for all methods at once
 * Used for comparison tracking and to ensure consistency
 */
export function generateAllPredictions() {
    const count = state.generatorCount || 3;
    const predictions = {
        frequency: [],
        cold: [],
        momentum: [],
        mixed: [],
        average: [],
        auto: [],
        shapes: []
    };

    // Generate frequency predictions
    predictions.frequency = getTopPredictions(count);

    // Generate cold predictions
    predictions.cold = getColdPredictions(count);

    // Generate mixed predictions
    predictions.mixed = getMixedPredictions(count);

    // Generate average predictions
    predictions.average = getAveragePredictions(count);

    // Generate auto predictions (uses best performing method)
    predictions.auto = getAutoPredictions(count);

    // Generate shapes predictions
    predictions.shapes = getShapePredictions(count);

    // Generate/use momentum predictions
    if (state.generatorMethod === 'momentum') {
        // Check if we should refresh momentum
        const config = getMomentumConfig();
        const currentRound = state.currentHistory.length;
        const shouldRefresh = state.momentumLastRefresh === 0 ||
            (currentRound - state.momentumLastRefresh) >= config.refreshFrequency;

        if (shouldRefresh) {
            predictions.momentum = getMomentumPrediction(config.patternSize, config);
            state.momentumLastRefresh = currentRound;
            state.momentumActuallyRefreshed = true;
            console.log(`[GenerateAll] Momentum refreshed at round ${currentRound}`);

            // Update countdown display
            if (window.__keno_updateMomentumCountdown) {
                window.__keno_updateMomentumCountdown();
            }
        } else {
            // Use cached momentum numbers
            predictions.momentum = state.generatedNumbers || state.momentumNumbers || [];
            state.momentumActuallyRefreshed = false;
            console.log(`[GenerateAll] Using cached momentum (${currentRound - state.momentumLastRefresh}/${config.refreshFrequency})`);
        }
    } else {
        // Generate fresh momentum for comparison
        try {
            const config = getMomentumConfig();
            predictions.momentum = getMomentumPrediction(config.patternSize, config);
        } catch (e) {
            console.warn('[GenerateAll] Momentum generation failed:', e);
        }
    }

    // Store the active method's predictions
    const activeMethod = state.generatorMethod;
    state.generatedNumbers = predictions[activeMethod] || [];

    // Update legacy state
    if (activeMethod === 'frequency') {
        state.predictedNumbers = state.generatedNumbers;
    } else if (activeMethod === 'momentum') {
        state.momentumNumbers = state.generatedNumbers;
    }

    // Highlight and auto-select if generator is active
    if (state.isGeneratorActive) {
        highlightPrediction(state.generatedNumbers);

        // Determine if we should auto-select
        const momentumShouldSelect = activeMethod === 'momentum' && state.momentumActuallyRefreshed;
        const shouldAutoSelect = activeMethod !== 'momentum' || momentumShouldSelect;

        if (state.generatorAutoSelect && shouldAutoSelect) {
            console.log(`[GenerateAll] Auto-selecting ${activeMethod} numbers`);
            waitForBetButtonReady(5000).then(() => {
                console.log('[GenerateAll] Bet button ready, selecting now');
                selectGeneratedNumbers(state.generatedNumbers);
            }).catch(err => {
                console.warn('[GenerateAll] Bet button wait failed:', err);
                setTimeout(() => selectGeneratedNumbers(state.generatedNumbers), 1000);
            });
        }
    }

    console.log('[GenerateAll] Predictions generated:', predictions);

    // Store predictions for comparison tracking on next round
    state.lastGeneratedPredictions = predictions;

    return predictions;
}

/**
 * Unified Number Generator - generates numbers based on selected method
 * This replaces separate predict and momentum functions
 */
export function generateNumbers(forceRefresh = false) {
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
    } else if (state.generatorMethod === 'cold') {
        const count = state.generatorCount || 3;
        generatedNumbers = getColdPredictions(count);
        console.log(`[Generator] Cold method generated ${generatedNumbers.length} numbers:`, generatedNumbers);
    } else if (state.generatorMethod === 'shapes') {
        const count = state.generatorCount || 5;
        generatedNumbers = getShapePredictions(count);
        console.log(`[Generator] Shapes method generated ${generatedNumbers.length} numbers:`, generatedNumbers);

        // Update shapes info display
        if (window.__keno_updateShapesInfo) {
            window.__keno_updateShapesInfo();
        }
    } else if (state.generatorMethod === 'momentum') {
        // Check if we should refresh momentum predictions
        const config = getMomentumConfig();
        const currentRound = state.currentHistory.length;
        const shouldRefresh = forceRefresh ||
            state.momentumLastRefresh === 0 ||
            (currentRound - state.momentumLastRefresh) >= config.refreshFrequency;

        if (shouldRefresh) {
            generatedNumbers = getMomentumPrediction(config.patternSize, config);
            state.momentumLastRefresh = state.currentHistory.length;
            state.momentumActuallyRefreshed = true; // Mark that we generated new numbers
            console.log(`[Generator] Momentum method refreshed at round ${currentRound}, generated ${generatedNumbers.length} numbers:`, generatedNumbers);

            // Log top numbers with momentum values
            logTopMomentumNumbers(config);

            // Update countdown display
            if (window.__keno_updateMomentumCountdown) {
                window.__keno_updateMomentumCountdown();
            }
        } else {
            // Use cached momentum numbers
            generatedNumbers = state.generatedNumbers || state.momentumNumbers || [];
            state.momentumActuallyRefreshed = false; // Using cached numbers
            console.log(`[Generator] Momentum method using cached numbers (${currentRound - state.momentumLastRefresh}/${config.refreshFrequency} rounds since refresh):`, generatedNumbers);

            // Update countdown display
            if (window.__keno_updateMomentumCountdown) {
                window.__keno_updateMomentumCountdown();
            }

            // Don't re-highlight or re-select if using cached numbers in auto-mode
            if (!forceRefresh) {
                return generatedNumbers;
            }
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
    // Only auto-select if:
    // 1. User manually clicked generate (forceRefresh = true), OR
    // 2. It's frequency/cold method (always regenerates), OR  
    // 3. Momentum actually refreshed (not using cache)
    const momentumShouldSelect = state.generatorMethod === 'momentum' && state.momentumActuallyRefreshed;
    const shouldAutoSelect = forceRefresh || state.generatorMethod !== 'momentum' || momentumShouldSelect;

    if (state.generatorAutoSelect && shouldAutoSelect) {
        console.log(`[Generator] Auto-selecting numbers (method: ${state.generatorMethod}, momentum refresh: ${state.momentumActuallyRefreshed})`);

        waitForBetButtonReady(5000).then(() => {
            // Button is ready and stable - select immediately
            console.log('[Generator] Bet button ready, selecting numbers now');
            selectGeneratedNumbers(generatedNumbers);
        }).catch(err => {
            console.warn('[Generator] Failed to wait for bet button, using fallback delay:', err);
            // Fallback only if button check failed
            setTimeout(() => {
                console.log('[Generator] Fallback - executing selectGeneratedNumbers');
                selectGeneratedNumbers(generatedNumbers);
            }, 1000);
        });
    } else if (state.generatorAutoSelect) {
        console.log('[Generator] Skipping auto-select (using cached momentum numbers)');
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

    console.log(`[Generator] Starting selection for ${numbers.length} numbers:`, numbers);
    console.log(`[Generator] Found ${tiles.length} tiles on board`);

    // Clear board first
    const clearButton = document.querySelector('button[data-testid="game-clear-table"]');
    if (clearButton) {
        console.log('[Generator] Clicking clear button');
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

/**
 * Get cold (least frequent) number predictions
 */
export function getColdPredictions(count) {
    const counts = {};
    const sampleCount = Math.min(state.generatorSampleSize, state.currentHistory.length);
    let sample = state.currentHistory.slice(-sampleCount);

    // Initialize all numbers with count 0
    for (let i = 1; i <= 40; i++) {
        counts[i] = 0;
    }

    // Count occurrences
    sample.forEach(round => {
        const hits = getHits(round);
        const misses = getMisses(round);
        const allHits = [...hits, ...misses];
        allHits.forEach(num => { counts[num] = (counts[num] || 0) + 1; });
    });

    // Sort by ascending count (least frequent first)
    const sorted = Object.entries(counts).sort((a, b) => a[1] - b[1]);
    const capped = Math.min(count, 40);
    return sorted.slice(0, capped).map(entry => parseInt(entry[0]));
}

/**
 * Get mixed predictions (combination of hot and cold numbers)
 */
export function getMixedPredictions(count) {
    const half = Math.floor(count / 2);
    const hotCount = count - half; // If odd number, hot gets the extra
    const coldCount = half;

    const hot = getTopPredictions(hotCount);
    const cold = getColdPredictions(coldCount);

    // Combine and sort
    return [...hot, ...cold].sort((a, b) => a - b);
}

/**
 * Get average frequency predictions (numbers appearing at median frequency)
 */
export function getAveragePredictions(count) {
    const counts = {};
    const sampleCount = Math.min(state.generatorSampleSize, state.currentHistory.length);
    let sample = state.currentHistory.slice(-sampleCount);

    // Initialize all numbers
    for (let i = 1; i <= 40; i++) {
        counts[i] = 0;
    }

    // Count occurrences
    sample.forEach(round => {
        const hits = getHits(round);
        const misses = getMisses(round);
        const allHits = [...hits, ...misses];
        allHits.forEach(num => { counts[num] = (counts[num] || 0) + 1; });
    });

    // Calculate median frequency
    const frequencies = Object.values(counts).sort((a, b) => a - b);
    const medianIndex = Math.floor(frequencies.length / 2);
    const median = frequencies[medianIndex];

    // Find numbers closest to median frequency
    const withDistance = Object.entries(counts).map(([num, freq]) => ({
        num: parseInt(num),
        freq,
        distance: Math.abs(freq - median)
    }));

    // Sort by distance to median (closest first), then by number
    withDistance.sort((a, b) => {
        if (a.distance !== b.distance) return a.distance - b.distance;
        return a.num - b.num;
    });

    const capped = Math.min(count, 40);
    return withDistance.slice(0, capped).map(item => item.num);
}

/**
 * Get auto mode predictions (uses best performing method from comparison data)
 */
export function getAutoPredictions(count) {
    // Check if we have comparison data
    if (!state.comparisonData || state.comparisonData.length < 5) {
        console.log('[Auto] Insufficient comparison data, using frequency');
        return getTopPredictions(count);
    }

    // Calculate accuracy for each method
    const methods = ['frequency', 'cold', 'momentum'];
    const accuracies = {};

    methods.forEach(method => {
        let totalHits = 0;
        let totalPredictions = 0;

        state.comparisonData.forEach(dataPoint => {
            if (dataPoint[method]) {
                totalHits += dataPoint[method].hits || 0;
                totalPredictions += dataPoint[method].count || 0;
            }
        });

        accuracies[method] = totalPredictions > 0 ? (totalHits / totalPredictions) * 100 : 0;
    });

    // Find best performing method
    const bestMethod = Object.entries(accuracies).sort((a, b) => b[1] - a[1])[0][0];
    console.log(`[Auto] Best performing method: ${bestMethod} (${accuracies[bestMethod].toFixed(1)}% accuracy)`);

    // Use the best method
    if (bestMethod === 'frequency') return getTopPredictions(count);
    if (bestMethod === 'cold') return getColdPredictions(count);
    if (bestMethod === 'momentum') {
        try {
            const config = getMomentumConfig();
            return getMomentumPrediction(config.patternSize, config);
        } catch (e) {
            console.warn('[Auto] Momentum failed, using frequency:', e);
            return getTopPredictions(count);
        }
    }

    // Fallback
    return getTopPredictions(count);
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
    if (!container) return;
    const tiles = Array.from(container.querySelectorAll('button'));
    // Deselect currently selected
    const currentlySelected = tiles.filter(isTileSelected);
    if (currentlySelected.length > 0) console.log('[AutoPlay] Deselecting tiles:', currentlySelected.map(t => parseInt((t.textContent || '').trim().split('%')[0])));
    currentlySelected.forEach(t => { try { simulatePointerClick(t); } catch (e) { try { t.click(); } catch { } } t.style.boxShadow = ''; t.style.transform = ''; t.style.opacity = '1'; });

    // Get predictions - use unified generator if active, otherwise fallback to frequency
    let predictions = [];
    if (state.isGeneratorActive && state.generatedNumbers.length > 0) {
        // Use numbers from unified generator
        predictions = state.generatedNumbers.slice(0, state.autoPlayPredictionCount);
        console.log('[AutoPlay] Using generated numbers from Number Generator:', predictions);
    } else {
        // Fallback to frequency-based predictions
        if (state.currentHistory.length === 0) predictions = generateRandomPrediction(state.autoPlayPredictionCount);
        else predictions = getTopPredictions(state.autoPlayPredictionCount);
        if (!predictions || predictions.length === 0) predictions = generateRandomPrediction(state.autoPlayPredictionCount);
        predictions = predictions.slice(0, state.autoPlayPredictionCount);
        console.log('[AutoPlay] Using fallback predictions:', predictions);
    }

    highlightPrediction(predictions);
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
        const playBtn = findAndClickPlayButton();
        if (!playBtn) {
            console.warn('[AutoPlay] could not find play button, will retry');
            setTimeout(() => { const retry = findAndClickPlayButton(); if (!retry) { setTimeout(() => { const retry2 = findAndClickPlayButton(); if (!retry2) console.warn('[AutoPlay] Play button not found'); else console.log('[AutoPlay] Play clicked 2nd retry'); }, 450); } else console.log('[AutoPlay] Play clicked on retry'); }, 450);
        } else console.log('[AutoPlay] Play button clicked');
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
window.__keno_generateAllPredictions = generateAllPredictions; // Generate all methods at once
window.__keno_generateNumbers = generateNumbers; // New unified generator
window.__keno_calculatePrediction = calculatePrediction; // Legacy
window.__keno_selectMomentumNumbers = selectMomentumNumbers; // Legacy
window.__keno_updateMomentumPredictions = updateMomentumPredictions;
window.__keno_updateMomentumCountdown = updateMomentumCountdown;
