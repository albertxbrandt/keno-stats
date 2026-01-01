/**
 * Storage utilities for site-wide features
 */

import { state } from './state.js';

const storageApi = typeof browser !== 'undefined' ? browser : chrome;

/**
 * Save toolbar settings to storage
 */
export async function saveToolbarSettings() {
  try {
    await storageApi.storage.local.set({
      toolbarSettings: {
        position: state.toolbarPosition,
        collapsed: state.toolbarCollapsed,
        enabled: state.siteWideSettings.toolbarEnabled,
      },
    });
  } catch (error) {
    console.error('[Stake] Failed to save toolbar settings:', error);
  }
}

/**
 * Load toolbar settings from storage
 */
export async function loadToolbarSettings() {
  try {
    const result = await storageApi.storage.local.get('toolbarSettings');
    if (result.toolbarSettings) {
      state.toolbarPosition = result.toolbarSettings.position || { x: 20, y: 20 };
      state.toolbarCollapsed = result.toolbarSettings.collapsed || false;
      state.siteWideSettings.toolbarEnabled = result.toolbarSettings.enabled !== false;
    }
  } catch (error) {
    console.error('[Stake] Failed to load toolbar settings:', error);
  }
}

/**
 * Toggle toolbar visibility
 */
export function toggleToolbar() {
  state.toolbarVisible = !state.toolbarVisible;
  state.siteWideSettings.toolbarEnabled = state.toolbarVisible;
  saveToolbarSettings();
}
