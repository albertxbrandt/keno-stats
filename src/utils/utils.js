// src/utils.js - misc helpers
import { state } from '../core/state.js';

export function simulatePointerClick(el) {
    try {
        const rect = el.getBoundingClientRect();
        const clientX = rect.left + rect.width / 2;
        const clientY = rect.top + rect.height / 2;
        ['pointerover', 'pointerenter', 'pointermove', 'pointerdown'].forEach(type => {
            el.dispatchEvent(new PointerEvent(type, { bubbles: true, cancelable: true, clientX, clientY, pointerType: 'mouse' }));
        });
        el.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true, clientX, clientY }));
        el.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, cancelable: true, clientX, clientY }));
        el.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, clientX, clientY }));
        el.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, cancelable: true, clientX, clientY, pointerType: 'mouse' }));
    } catch (e) {
        try { el.click(); } catch (e2) { console.error('[simulateClick] fallback failed', e2); }
    }
}

export function findAndClickPlayButton() {
    // Finding by data-testid="bet-button"
    const betButton = document.querySelector('button[data-testid="bet-button"]');
    if (betButton) {
        simulatePointerClick(betButton);
        return betButton;
    }

    return null;
}

/**
 * Clear all selected tiles using the game's Clear Table button
 * @returns {boolean} True if successful
 */
export function clearTable() {
    const clearButton = document.querySelector('button[data-testid="game-clear-table"]');
    if (!clearButton) {
        console.warn('[Utils] Clear Table button not found');
        return false;
    }

    try {
        simulatePointerClick(clearButton);
        console.log('[Utils] Clear Table button clicked');
        return true;
    } catch (e) {
        console.error('[Utils] Failed to click Clear Table button:', e);
        return false;
    }
}

/**
 * Wait for the bet button to be ready (data-test-action-enabled="true")
 * This ensures the board is ready for interaction after a bet completes
 */
export function waitForBetButtonReady(maxWaitMs = 5000) {
    return new Promise((resolve, reject) => {
        const startTime = Date.now();
        const betButton = document.querySelector('button[data-testid="bet-button"]');

        if (!betButton) {
            reject(new Error('Bet button not found'));
            return;
        }

        // Use MutationObserver to watch for attribute changes
        const observer = new MutationObserver((mutations) => {
            const isReady = betButton.getAttribute('data-test-action-enabled') === 'true';

            if (isReady) {
                console.log('[Utils] Bet button ready (observed)');
                observer.disconnect();
                resolve(betButton);
            }
        });

        // Observe the bet button's attributes
        observer.observe(betButton, {
            attributes: true,
            attributeFilter: ['data-test-action-enabled']
        });

        // Check initial state (might already be ready)
        if (betButton.getAttribute('data-test-action-enabled') === 'true') {
            console.log('[Utils] Bet button already ready');
            observer.disconnect();
            resolve(betButton);
            return;
        }

        // Timeout fallback
        setTimeout(() => {
            observer.disconnect();
            console.warn('[Utils] Bet button ready timeout');
            reject(new Error('Bet button ready timeout'));
        }, maxWaitMs);
    });
}
