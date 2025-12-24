// src/features/savedNumbersBridge.js - Exposes savedNumbers functions via window globals
import {
  saveNumberCombination,
  trackPlayedNumbers,
  getSavedNumbers,
  getRecentlyPlayed
} from './savedNumbersCore.js';

/**
 * Initialize window globals for legacy compatibility
 * @param {Object} modalsApi - Modal management API from useModals hook
 */
export function initSavedNumbersGlobals(modalsApi) {
  window.__keno_showSavedNumbers = modalsApi.showSavedNumbers;
  window.__keno_analyzeCombination = modalsApi.showCombinationHits;
  // updateRecentPlayed is now handled by the RecentPlays component
  window.__keno_updateRecentPlayed = () => {
    // No-op: Component handles its own updates via events
  };
}

// Export core functions
export { saveNumberCombination, trackPlayedNumbers, getSavedNumbers, getRecentlyPlayed };
