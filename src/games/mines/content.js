/**
 * Mines game content script
 * Entry point for Mines game tracking
 */

import { state } from './core/state.js';
import { stateEvents, EVENTS } from './core/stateEvents.js';
import { initMinesOverlay } from './ui/MinesOverlay';
import { saveMinesRound } from './core/storage';

let overlayContainer = null;

/**
 * Initialize Mines tracker
 */
export function init() {
  // eslint-disable-next-line no-console
  console.log('[Mines] Initializing Mines tracker...');

  // Check if we're on the Mines page
  if (!window.location.href.includes('/casino/games/mines')) {
    return;
  }

  // Set up message listener for intercepted data
  setupMessageListener();

  // Wait for game elements to load
  waitForMinesElements(() => {
    // eslint-disable-next-line no-console
    console.log('[Mines] Game elements found, initializing overlay');
    initOverlay();
  });
}

/**
 * Set up message listener for data from interceptor
 */
function setupMessageListener() {
  window.addEventListener('message', async (event) => {
    // Validate message source
    if (event.source !== window) return;

    const { type, payload } = event.data;

    // Handle Mines data from interceptor
    if (type === 'MINES_DATA_FROM_PAGE') {
      // Data received from interceptor

      try {
        // Save round to storage
        await saveMinesRound(payload);

        // Update UI state
        state.lastRound = {
          id: payload.id,
          revealed: payload.state.rounds.length,
          multiplier: payload.payoutMultiplier,
          won: payload.payout > 0,
          minesCount: payload.state.minesCount,
        };

        // Emit event for UI updates
        stateEvents.emit(EVENTS.ROUND_SAVED, state.lastRound);
        stateEvents.emit(EVENTS.HISTORY_UPDATED, {});
      } catch (error) {
        console.error('[Mines Content] Error saving round:', error);
      }
    }

    // Handle connection test
    if (type === 'MINES_CONNECTION_TEST') {
      state.interceptorActive = true;
    }
  });
}

/**
 * Wait for Mines game elements to be present in DOM
 */
function waitForMinesElements(callback, maxAttempts = 50) {
  let attempts = 0;

  const checkElements = () => {
    // Check for Mines game container
    const minesContainer = document.querySelector('[class*="mines"]') ||
      document.querySelector('[data-testid*="mines"]') ||
      document.querySelector('div[class*="game"]');

    if (minesContainer) {
      // eslint-disable-next-line no-console
      console.log('[Mines] Game container found after', attempts, 'attempts');
      callback();
    } else if (attempts < maxAttempts) {
      attempts++;
      setTimeout(checkElements, 200);
    } else {
      console.warn('[Mines] Timeout waiting for game elements');
    }
  };

  checkElements();
}

/**
 * Initialize overlay
 */
function initOverlay() {
  if (overlayContainer) {
    return; // Already initialized
  }

  // Create overlay container
  overlayContainer = document.createElement('div');
  overlayContainer.id = 'mines-overlay-root';
  document.body.appendChild(overlayContainer);

  // Render overlay using component's init function
  initMinesOverlay(overlayContainer, () => {
    state.overlayVisible = false;
    if (overlayContainer) {
      overlayContainer.remove();
      overlayContainer = null;
    }
  });

  state.overlayVisible = true;
}

/**
 * Clean up on page unload
 */
window.addEventListener('beforeunload', () => {
  if (overlayContainer) {
    overlayContainer.remove();
    overlayContainer = null;
  }
});
