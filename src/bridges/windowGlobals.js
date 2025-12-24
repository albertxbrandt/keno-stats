// src/bridges/windowGlobals.js
// Central location for all window.__keno_* global functions
// These are exposed for legacy compatibility and external access

import { state } from '../core/state.js';
import { detectGameDifficulty, trackRoundComparison } from '../storage/comparison.js';
import { getRecentPlays, clearHistory } from '../storage/history.js';
import {
  recalculateTotalProfit,
  resetSessionProfit,
  changeCurrency,
  updateSessionProfit,
  getSessionProfit,
  getTotalProfit
} from '../storage/profitLoss.js';
import { updateProfitLossUI } from '../utils/dom/profitLossUI.js';
import { replaceSelection } from '../utils/dom/tileSelection.js';
import { waitForBetButtonReady } from '../utils/dom/utils.js';

/**
 * Initialize all window globals for UI and external access
 * Called after ModalsProvider mounts and modalsApi is available
 * 
 * NOTE: This is only for modal-related, profit/loss, and history functions.
 * Other window globals are set directly in their respective modules:
 * - numberSelection.js: __keno_generateNumbers, __keno_selectPredictedNumbers, etc.
 * - heatmap.js: __keno_highlightRound, __keno_clearHighlight, etc.
 * - previewHighlight.js: __keno_initButtonPreviewHighlight, etc.
 * - patterns.js: __keno_clearPatternCache
 * - momentumCore.js: __keno_momentum (debug object)
 * - content.js: __keno_state
 * 
 * @param {Object} modalsApi - Modal management API from useModals hook
 */
export function initWindowGlobals(modalsApi) {
  // ===== Recent Plays =====
  window.__keno_getRecentPlays = () => getRecentPlays(5);
  window.__keno_selectNumbers = async (numbers) => {
    try {
      await waitForBetButtonReady(3000);
      await replaceSelection(numbers);
    } catch (err) {
      console.warn('[WindowGlobals] Failed to select numbers:', err);
    }
  };

  // ===== Saved Numbers Modals =====
  window.__keno_showSavedNumbers = modalsApi.showSavedNumbers;
  window.__keno_analyzeCombination = (numbers, name = 'Combination') => {
    modalsApi.showCombinationHits(numbers, name);
  };

  // updateRecentPlayed is now handled by the RecentPlays component automatically
  window.__keno_updateRecentPlayed = () => {
    // No-op: Component handles its own updates via events
  };

  // ===== Pattern Analysis Modal =====
  window.__keno_showPatternAnalysis = (patternSize, sortBy, sampleSize) => {
    modalsApi.showPatternAnalysis(patternSize, sortBy, sampleSize);
  };

  window.__keno_showLivePatternAnalysis = () => {
    modalsApi.showLivePatternAnalysis();
  };

  // ===== Comparison Window =====
  window.__keno_toggleComparison = modalsApi.toggleComparison;
  window.__keno_trackRound = trackRoundComparison;

  // ===== History Management =====
  window.__keno_clearHistory = clearHistory;
  window.__keno_openBetBook = () => {
    window.open(chrome.runtime.getURL('betbook.html'), '_blank', 'width=1200,height=800');
  };

  // ===== Profit/Loss =====
  window.__keno_updateProfitLossUI = updateProfitLossUI;
  window.__keno_resetSessionProfit = resetSessionProfit;
  window.__keno_recalculateTotalProfit = recalculateTotalProfit;
  window.__keno_changeCurrency = changeCurrency;
  window.__keno_getSessionProfit = getSessionProfit;
  window.__keno_getTotalProfit = getTotalProfit;
  window.__keno_updateProfit = (profit, currency) => {
    updateSessionProfit(profit, currency);
  };

  // Start difficulty detection for comparison
  detectGameDifficultyPeriodically();
}

/**
 * Detect game difficulty periodically and update state
 * @private
 */
function detectGameDifficultyPeriodically() {
  const updateDifficulty = () => {
    const newDifficulty = detectGameDifficulty();
    if (newDifficulty && state.gameDifficulty !== newDifficulty) {
      state.gameDifficulty = newDifficulty;
    }
  };

  // Initial detection
  updateDifficulty();

  // Periodic detection every 2 seconds
  setInterval(updateDifficulty, 2000);
}
