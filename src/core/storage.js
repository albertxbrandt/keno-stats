// src/core/storage.js
// BACKWARD COMPATIBILITY WRAPPER
// Re-exports functions from new storage layer for existing imports
// This allows gradual migration of imports across codebase

// History operations
export {
  saveRound,
  loadHistory,
  clearHistory,
  updateHistoryUI,
  getHits,
  getMisses,
  getDrawn,
  getSelected
} from '../storage/history.js';

// Settings operations
export {
  saveGeneratorSettings,
  loadGeneratorSettings,
  saveHeatmapSettings,
  loadHeatmapSettings
} from '../storage/settings.js';
