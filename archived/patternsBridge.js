// src/features/patternsBridge.js - Exposes pattern functions via window globals

/**
 * Initialize window globals for legacy compatibility
 * @param {Object} modalsApi - Modal management API from useModals hook
 */
export function initPatternGlobals(modalsApi) {
  window.__keno_showPatternAnalysis = (patternSize, sortBy, sampleSize) => {
    modalsApi.showPatternAnalysis(patternSize, sortBy, sampleSize);
  };
}

// Re-export core functions
export { clearPatternCache, findCommonPatterns, getPatternStats } from './patternsCore.js';
