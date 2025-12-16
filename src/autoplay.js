// src/autoplay.js
import { state } from './state.js';
import { saveRound, getHits, getMisses } from './storage.js';
import { simulatePointerClick, findAndClickPlayButton } from './utils.js';
import { highlightPrediction } from './heatmap.js';
import { getMomentumPrediction } from './momentum.js';

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
    const sampleCount = Math.min(state.sampleSize, state.currentHistory.length);
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
    if (!container) return;
    const tiles = Array.from(container.querySelectorAll('button'));
    // Deselect currently selected
    const currentlySelected = tiles.filter(isTileSelected);
    if (currentlySelected.length > 0) console.log('[AutoPlay] Deselecting tiles:', currentlySelected.map(t => parseInt((t.textContent || '').trim().split('%')[0])));
    currentlySelected.forEach(t => { try { simulatePointerClick(t); } catch (e) { try { t.click(); } catch { } } t.style.boxShadow = ''; t.style.transform = ''; t.style.opacity = '1'; });
    // Predictions
    let predictions = [];
    if (state.currentHistory.length === 0) predictions = generateRandomPrediction(state.autoPlayPredictionCount);
    else predictions = getTopPredictions(state.autoPlayPredictionCount);
    if (!predictions || predictions.length === 0) predictions = generateRandomPrediction(state.autoPlayPredictionCount);
    predictions = predictions.slice(0, state.autoPlayPredictionCount);
    console.log('[AutoPlay] Predictions:', predictions);
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

// Expose calculatePrediction for heatmap/pred UI
window.__keno_calculatePrediction = calculatePrediction;
window.__keno_getMomentumPredictions = getMomentumBasedPredictions;
