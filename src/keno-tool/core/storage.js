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
} from '@/shared/storage/history.js';

// Settings operations
export {
  saveGeneratorSettings,
  loadGeneratorSettings,
  saveHeatmapSettings,
  loadHeatmapSettings
} from '@/shared/storage/settings.js';
