// src/autoplay.js
// AUTO-PLAY BETTING LOGIC ONLY
// Automatically places bets using generated numbers

import { state } from './state.js';
import { simulatePointerClick, findAndClickPlayButton } from './utils.js';
import { getTopPredictions } from './numberSelection.js';

// ============================================================================
// AUTO-PLAY BETTING CORE
// ============================================================================

/**
 * Place bet using current strategy
 * This is the main auto-play function that:
 * 1. Deselects currently selected tiles
 * 2. Gets predictions from generator or fallback
 * 3. Selects tiles based on predictions
 * 4. Clicks play button
 */
export function autoPlayPlaceBet() {
    const container = document.querySelector('div[data-testid="game-keno"]');
    if (!container) {
        console.error('[AutoPlay] Game container not found');
        return;
    }

    const tiles = Array.from(container.querySelectorAll('button'));

    // Deselect currently selected tiles
    deselectAllTiles(tiles);

    // Get predictions from unified generator or fallback
    let predictions = [];
    if (state.isGeneratorActive && state.generatedNumbers.length > 0) {
        // Use numbers from unified generator
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

    // Select tiles based on predictions
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
                    console.error(`[AutoPlay] Failed to click tile ${num}:`, err);
                }
            }
        }
    });

    // Click play button after short delay
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
 * Update auto-play UI elements
 * Updates status text, button text/color, and timer display
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
// HELPER FUNCTIONS
// ============================================================================

/**
 * Deselect all tiles on game board
 * @private
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
 * @private
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
 * Generate random predictions (fallback when no history available)
 * @param {number} count - Number of predictions to generate
 * @returns {Array<number>} Random numbers 1-40
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
