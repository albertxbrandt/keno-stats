/**
 * Mines game content script
 * Entry point for Mines game tracking
 */

import { state } from './core/state.js';
import { initMinesOverlay } from './ui/MinesOverlay.jsx';

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

  // Wait for game elements to load
  waitForMinesElements(() => {
    // eslint-disable-next-line no-console
    console.log('[Mines] Game elements found, initializing overlay');
    initOverlay();
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
