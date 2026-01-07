// src/keno-tool/ui/constants/sections.js
// Single source of truth for overlay panel sections

/**
 * Panel section definitions
 * Used by both SettingsPanel (for toggles) and Overlay (for rendering)
 */
// Note: Icons are now rendered as Lucide components in actual UI
// These icon strings are kept for backwards compatibility but not actively used
export const PANEL_SECTIONS = [
  { id: 'heatmap', label: 'Heatmap', icon: 'Map' },
  { id: 'numberGenerator', label: 'Number Generator', icon: 'Dices' },
  { id: 'hitsMiss', label: 'Hits / Miss Display', icon: 'Check' },
  { id: 'profitLoss', label: 'Profit/Loss', icon: 'DollarSign' },
  { id: 'patternAnalysis', label: 'Pattern Analysis', icon: 'Search' },
  { id: 'recentPlays', label: 'Recent Plays', icon: 'Clock' },
  { id: 'history', label: 'History', icon: 'ScrollText' }
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
