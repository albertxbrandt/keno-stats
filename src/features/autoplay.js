// src/autoplay.js
// AUTO-PLAY BETTING LOGIC ONLY
// Automatically places bets using generated numbers

import { state } from '../core/state.js';
import { findAndClickPlayButton } from '../utils/utils.js';
import { getTopPredictions } from '../ui/numberSelection.js';
import { replaceSelection } from '../utils/tileSelection.js';

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

    // Select tiles using shared utility (now async)
    replaceSelection(predictions).then(result => {
        if (result.failed.length > 0) {
            console.warn('[AutoPlay] Failed to select tiles:', result.failed);
        }

        // Click play button after short delay
        setTimeout(() => {
            const playBtn = findAndClickPlayButton();
            if (!playBtn) {
                console.error('[AutoPlay] Play button not found');
                state.isAutoPlayMode = false;
                updateAutoPlayUI();
            }
        }, 500);
    });
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
