// src/ui/overlayInit.js
// Initialization bridge between content.js and Preact App component

import { render } from 'preact';
import { App } from './App.jsx';
import { state } from '../core/state.js';
import { loadGeneratorSettings, loadHeatmapSettings } from '../core/storage.js';
import { initWindowGlobals } from '../bridges/windowGlobals.js';

// Store modals API reference
let modalsApiRef = null;

/**
 * Initialize the Preact app
 * Loads settings and renders the App component into the DOM
 * 
 * @returns {Promise<void>}
 */
export async function initOverlay() {
  // Load all settings first
  await Promise.all([loadGeneratorSettings(), loadHeatmapSettings()]);

  // Create container if it doesn't exist
  let container = document.getElementById('keno-tracker-root');
  if (!container) {
    container = document.createElement('div');
    container.id = 'keno-tracker-root';
    document.body.appendChild(container);
  }

  // Render Preact app (includes Overlay + ModalsManager)
  render(<App />, container);

  // Wait for app to mount, then expose modals API via a hook in App
  setTimeout(() => {
    // Access modals API from window (set by ModalsProvider)
    if (window.__keno_modalsApi) {
      modalsApiRef = window.__keno_modalsApi;

      // Initialize all bridge globals with modals API
      initWindowGlobals(modalsApiRef);
    }

    // Trigger initial generator preview
    if (window.__keno_generateNumbers) {
      // eslint-disable-next-line no-console
      console.log('[Overlay] Triggering initial generator preview');
      window.__keno_generateNumbers(false, false).catch(() => {
        // Ignore errors on initial generation (history might be empty)
      });
    }
  }, 100);

  // eslint-disable-next-line no-console
  console.log('[Overlay] Preact app initialized');
}

/**
 * Toggle overlay visibility
 * Called by footer button
 */
function toggleOverlay() {
  state.isOverlayVisible = !state.isOverlayVisible;

  // Update button text
  const btn = document.getElementById('keno-tracker-toggle-btn');
  if (btn) {
    btn.textContent = state.isOverlayVisible ? '📊 Close Stats' : '📊 Open Stats';
  }

  // Trigger re-render by dispatching custom event
  // The Overlay component will read state.isOverlayVisible and update
  window.dispatchEvent(new CustomEvent('keno-overlay-toggle'));
}

/**
 * Inject footer button to toggle overlay visibility
 * This uses DOM manipulation since it's outside the Preact component tree
 * 
 * @returns {void}
 */
export function injectFooterButton() {
  // Check if we're on the Keno page
  if (!window.location.href.includes('keno')) {
    // Remove button if it exists and we're not on Keno page
    const existingBtn = document.getElementById('keno-tracker-toggle-btn');
    if (existingBtn) existingBtn.remove();

    // Hide overlay
    state.isOverlayVisible = false;

    return;
  }

  // Check if button already exists
  if (document.getElementById('keno-tracker-toggle-btn')) return;

  // Find the footer container
  const footer = document.querySelector('.game-footer .stack');
  if (!footer) {
    console.warn('[Overlay] Footer container not found, retrying in 500ms');
    setTimeout(injectFooterButton, 500);
    return;
  }

  // Create toggle button
  const btn = document.createElement('button');
  btn.id = 'keno-tracker-toggle-btn';
  btn.textContent = state.isOverlayVisible ? '📊 Close Stats' : '📊 Open Stats';
  Object.assign(btn.style, {
    padding: '8px 12px',
    background: '#1a2c38',
    color: '#fff',
    border: '1px solid #2f4553',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '11px',
    fontWeight: 'bold',
    marginTop: '8px'
  });

  // Toggle overlay visibility
  btn.addEventListener('click', toggleOverlay);

  footer.appendChild(btn);
}