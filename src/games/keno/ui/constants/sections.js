// src/keno-tool/ui/constants/sections.js
// Single source of truth for overlay panel sections

/**
 * Panel section definitions
 * Used by both SettingsPanel (for toggles) and Overlay (for rendering)
 */
export const PANEL_SECTIONS = [
  { id: 'heatmap', label: 'Heatmap', icon: '🗺️' },
  { id: 'numberGenerator', label: 'Number Generator', icon: '🎲' },
  { id: 'hitsMiss', label: 'Hits / Miss Display', icon: '✅' },
  { id: 'profitLoss', label: 'Profit/Loss', icon: '💰' },
  { id: 'patternAnalysis', label: 'Pattern Analysis', icon: '🔍' },
  { id: 'recentPlays', label: 'Recent Plays', icon: '🎲' },
  { id: 'history', label: 'History', icon: '📜' }
];

/**
 * Default visibility state for all panels
 * All panels visible by default
 */
export const DEFAULT_PANEL_VISIBILITY = PANEL_SECTIONS.reduce((acc, section) => {
  acc[section.id] = true;
  return acc;
}, {});

/**
 * Get array of valid panel section IDs
 */
export function getValidPanelIds() {
  return PANEL_SECTIONS.map(s => s.id);
}

/**
 * Validate panel visibility object
 * Removes legacy/invalid keys, ensures all valid sections present
 */
export function validatePanelVisibility(visibility) {
  const validIds = getValidPanelIds();
  const cleaned = {};

  // Only keep valid section IDs
  validIds.forEach(id => {
    cleaned[id] = visibility[id] !== false; // Default to true
  });

  return cleaned;
}
