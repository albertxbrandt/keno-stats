// src/utils.js - misc helpers
import { state } from './state.js';

export function simulatePointerClick(el) {
    try {
        const rect = el.getBoundingClientRect();
        const clientX = rect.left + rect.width / 2;
        const clientY = rect.top + rect.height / 2;
        ['pointerover','pointerenter','pointermove','pointerdown'].forEach(type => {
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
 * Wait for play button to become enabled, then click it
 * @param {number} maxWaitMs - Maximum time to wait (default 10000ms = 10 seconds)
 * @param {number} checkIntervalMs - How often to check (default 100ms)
 * @returns {Promise<boolean>} - Resolves true if clicked, false if timed out
 */
export function waitForPlayButtonAndClick(maxWaitMs = 10000, checkIntervalMs = 100) {
    return new Promise((resolve) => {
        const startTime = Date.now();
        
        const checkButton = () => {
            const betButton = document.querySelector('button[data-testid="bet-button"]');
            
            if (!betButton) {
                // Button not found - keep checking
                if (Date.now() - startTime < maxWaitMs) {
                    setTimeout(checkButton, checkIntervalMs);
                } else {
                    console.warn('[waitForPlayButton] Button not found, timed out');
                    resolve(false);
                }
                return;
            }
            
            // Check if button is enabled (not disabled)
            const isDisabled = betButton.disabled || 
                              betButton.getAttribute('disabled') !== null ||
                              betButton.getAttribute('aria-disabled') === 'true' ||
                              betButton.classList.contains('disabled');
            
            if (isDisabled) {
                // Button still disabled - keep checking
                if (Date.now() - startTime < maxWaitMs) {
                    setTimeout(checkButton, checkIntervalMs);
                } else {
                    console.warn('[waitForPlayButton] Button still disabled, timed out');
                    resolve(false);
                }
                return;
            }
            
            // Button is enabled - click it!
            console.log('[waitForPlayButton] Button enabled, clicking now');
            simulatePointerClick(betButton);
            resolve(true);
        };
        
        // Start checking
        checkButton();
    });
}

/**
 * Wait for clear button to become enabled, then click it
 * @param {number} maxWaitMs - Maximum time to wait (default 3000ms)
 * @param {number} checkIntervalMs - How often to check (default 50ms)
 * @returns {Promise<boolean>} - Resolves true if clicked, false if timed out
 */
export function waitForClearButtonAndClick(maxWaitMs = 3000, checkIntervalMs = 50) {
    return new Promise((resolve) => {
        const startTime = Date.now();
        
        const checkButton = () => {
            const clearButton = document.querySelector('button[data-testid="game-clear-table"]');
            
            if (!clearButton) {
                if (Date.now() - startTime < maxWaitMs) {
                    setTimeout(checkButton, checkIntervalMs);
                } else {
                    console.warn('[waitForClearButton] Button not found, timed out');
                    resolve(false);
                }
                return;
            }
            
            // Check if button is enabled
            const isDisabled = clearButton.disabled || 
                              clearButton.getAttribute('disabled') !== null ||
                              clearButton.getAttribute('aria-disabled') === 'true' ||
                              clearButton.classList.contains('disabled');
            
            if (isDisabled) {
                if (Date.now() - startTime < maxWaitMs) {
                    setTimeout(checkButton, checkIntervalMs);
                } else {
                    console.warn('[waitForClearButton] Button still disabled, timed out');
                    resolve(false);
                }
                return;
            }
            
            // Button is enabled - click it!
            console.log('[waitForClearButton] Button enabled, clicking now');
            simulatePointerClick(clearButton);
            resolve(true);
        };
        
        checkButton();
    });
}
