// src/core/stateEvents.js
// Event system for state changes

import { EventEmitter } from "@/shared/utils/EventEmitter.js";

// Create singleton instance for Keno
export const stateEvents = new EventEmitter();

// Event names (namespaced for Keno)
export const EVENTS = {
  HISTORY_UPDATED: 'history:updated',
  GENERATOR_UPDATED: 'generator:updated',
  GENERATOR_PREVIEW_UPDATED: 'generator:preview:updated',
  HEATMAP_UPDATED: 'heatmap:updated',
  ROUND_SAVED: 'round:saved',
  SETTINGS_CHANGED: 'settings:changed',
  PANEL_VISIBILITY_CHANGED: 'panel:visibility:changed',
  PROFIT_UPDATED: 'profit:updated',
};
