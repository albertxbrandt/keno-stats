// src/storage/settings.js
// Generator and heatmap settings persistence

import { state } from '@/keno-tool/core/state.js';

const storageApi = (typeof browser !== 'undefined') ? browser : chrome;

/**
 * Save panel visibility settings to storage
 * @returns {void}
 */
export function savePanelVisibility() {
  storageApi.storage.local.set({ panelVisibility: state.panelVisibility });
}

/**
 * Load panel visibility settings from storage
 * @returns {Promise<Object|null>} Settings object or null if not found
 */
export function loadPanelVisibility() {
  return storageApi.storage.local.get('panelVisibility').then(res => {
    if (res.panelVisibility) {
      state.panelVisibility = { ...state.panelVisibility, ...res.panelVisibility };
      return res.panelVisibility;
    }
    return null;
  });
}

/**
 * Save panel order settings to storage
 * @returns {void}
 */
export function savePanelOrder() {
  storageApi.storage.local.set({ panelOrder: state.panelOrder });
}

/**
 * Load panel order settings from storage
 * @returns {Promise<Array|null>} Order array or null if not found
 */
export function loadPanelOrder() {
  return storageApi.storage.local.get('panelOrder').then(res => {
    if (res.panelOrder) {
      state.panelOrder = res.panelOrder;
      return res.panelOrder;
    }
    return null;
  });
}

/**
 * Save all generator settings to storage (auto-save system)
 * Persists 11 settings: method, count, interval, auto-refresh, sample size, shapes, momentum
 * Call this immediately after ANY generator setting changes in UI
 * 
 * @example
 * methodSelect.addEventListener('change', (e) => {
 *   state.generatorMethod = e.target.value;
 *   saveGeneratorSettings(); // Auto-save immediately
 * });
 * 
 * @returns {void}
 */
export function saveGeneratorSettings() {
  const settings = {
    generatorMethod: state.generatorMethod,
    generatorCount: state.generatorCount,
    generatorInterval: state.generatorInterval,
    generatorAutoRefresh: state.generatorAutoRefresh,
    generatorSampleSize: state.generatorSampleSize,
    // Shapes settings
    shapesPattern: state.shapesPattern,
    shapesPlacement: state.shapesPlacement,
    // Momentum settings
    momentumDetectionWindow: state.momentumDetectionWindow,
    momentumBaselineGames: state.momentumBaselineGames,
    momentumThreshold: state.momentumThreshold,
    momentumPoolSize: state.momentumPoolSize
  };

  storageApi.storage.local.set({ generatorSettings: settings });

  // Auto-update preview after any generator setting changes
  // This keeps the "Next Numbers" preview in sync with current configuration
  if (window.__keno_updateGeneratorPreview) {
    window.__keno_updateGeneratorPreview();
  }
}

/**
 * Load generator settings from storage
 * @returns {Promise<Object|null>} Settings object or null if not found
 */
export function loadGeneratorSettings() {
  return storageApi.storage.local.get('generatorSettings').then(res => {
    if (res.generatorSettings) {
      const settings = res.generatorSettings;

      // Apply settings to state
      if (settings.generatorMethod !== undefined) state.generatorMethod = settings.generatorMethod;
      if (settings.generatorCount !== undefined) state.generatorCount = settings.generatorCount;
      if (settings.generatorInterval !== undefined) state.generatorInterval = settings.generatorInterval;
      if (settings.generatorAutoRefresh !== undefined) state.generatorAutoRefresh = settings.generatorAutoRefresh;
      if (settings.generatorSampleSize !== undefined) state.generatorSampleSize = settings.generatorSampleSize;

      // Shapes settings
      if (settings.shapesPattern !== undefined) state.shapesPattern = settings.shapesPattern;
      if (settings.shapesPlacement !== undefined) state.shapesPlacement = settings.shapesPlacement;

      // Momentum settings
      if (settings.momentumDetectionWindow !== undefined) state.momentumDetectionWindow = settings.momentumDetectionWindow;
      if (settings.momentumBaselineGames !== undefined) state.momentumBaselineGames = settings.momentumBaselineGames;
      if (settings.momentumThreshold !== undefined) state.momentumThreshold = settings.momentumThreshold;
      if (settings.momentumPoolSize !== undefined) state.momentumPoolSize = settings.momentumPoolSize;

      return settings;
    }
    return null;
  });
}

/**
 * Save heatmap settings to storage
 * @returns {void}
 */
export function saveHeatmapSettings() {
  const settings = {
    isHeatmapActive: state.isHeatmapActive,
    heatmapMode: state.heatmapMode,
    heatmapSampleSize: state.heatmapSampleSize
  };

  storageApi.storage.local.set({ heatmapSettings: settings });
}

/**
 * Load heatmap settings from storage
 * @returns {Promise<Object|null>} Settings object or null if not found
 */
export function loadHeatmapSettings() {
  return storageApi.storage.local.get('heatmapSettings').then(res => {
    if (res.heatmapSettings) {
      const settings = res.heatmapSettings;

      if (settings.isHeatmapActive !== undefined) state.isHeatmapActive = settings.isHeatmapActive;
      if (settings.heatmapMode !== undefined) state.heatmapMode = settings.heatmapMode;
      if (settings.heatmapSampleSize !== undefined) state.heatmapSampleSize = settings.heatmapSampleSize;

      return settings;
    }
    return null;
  });
}
