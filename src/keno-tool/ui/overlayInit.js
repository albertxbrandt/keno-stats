// src/ui/overlayInit.js
// Initialization bridge between content.js and Preact App component

import { render } from 'preact';
import { App } from './App.jsx';
import { state } from '@/keno-tool/core/state.js';
import { loadGeneratorSettings, loadHeatmapSettings, loadPanelVisibility, loadPanelOrder } from '@/keno-tool/core/storage.js';
import { initWindowGlobals } from '@/keno-tool/bridges/windowGlobals.js';

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
  await Promise.all([
    loadGeneratorSettings(),
    loadHeatmapSettings(),
    loadPanelVisibility(),
    loadPanelOrder()
  ]);

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
    if (window.__keno_updateGeneratorPreview) {
      // eslint-disable-next-line no-console
      console.log('[Overlay] Triggering initial generator preview');
      try {
        window.__keno_updateGeneratorPreview();
      } catch {
        // Ignore errors on initial generation (history might be empty)
      }
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
    const statusText = state.isOverlayVisible ? 'Close Stats' : 'Open Stats';
    const span = btn.querySelector('span');
    if (span) {
      span.textContent = statusText;
    }
  }

  // Trigger re-render by dispatching custom event
  // The Overlay component will read state.isOverlayVisible and update
  window.dispatchEvent(new CustomEvent('keno-overlay-toggle'));
}

/**
 * Observe the game container and inject footer button when footer appears
 * This uses MutationObserver to detect footer changes without polling
 * @returns {void}
 */
export function observeFooterForButton() {
  const gameContainer = document.querySelector('div[data-testid="game-keno"]');
  if (!gameContainer) {
    console.warn('[Overlay] Game container not found, button injection disabled');
    return;
  }

  // Try to inject immediately
  injectFooterButton();

  // Observe footer changes (for SPA navigation and dynamic updates)
  const observer = new MutationObserver(() => {
    injectFooterButton();
  });

  observer.observe(gameContainer, {
    childList: true,
    subtree: true
  });
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
  const btn = document.createElement('div');
  btn.id = 'keno-tracker-toggle-btn';

  Object.assign(btn.style, {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    padding: '0 10px',
    opacity: '0.7',
    transition: 'opacity 0.2s'
  });

  const statusText = state.isOverlayVisible ? 'Close Stats' : 'Open Stats';
  btn.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color: #fff;">
      <line x1="18" y1="20" x2="18" y2="10"></line>
      <line x1="12" y1="20" x2="12" y2="4"></line>
      <line x1="6" y1="20" x2="6" y2="14"></line>
    </svg>
    <span style="margin-left:5px; font-size:12px; font-weight:bold; color:#fff;">${statusText}</span>
  `;

  // Hover effect
  btn.addEventListener('mouseenter', () => btn.style.opacity = '1');
  btn.addEventListener('mouseleave', () => btn.style.opacity = '0.7');

  // Toggle overlay visibility
  btn.addEventListener('click', toggleOverlay);

  footer.appendChild(btn);
}