/**
 * Site-wide content script coordinator
 * Runs on all Stake.com pages and routes to appropriate game modules
 */

import { render, h } from 'preact';
import { detectCurrentGame } from './core/urlDetector.js';
import { state } from './core/state.js';
import { loadToolbarSettings } from './core/storage.js';
import { Toolbar } from './ui/Toolbar.jsx';

// Game module registry
const gameModules = {
  keno: null, // Lazy loaded when needed
};

/**
 * Initialize site-wide features
 */
async function initSiteWide() {
  // eslint-disable-next-line no-console
  console.log('[Stake] Keno Stats Extension loaded');
  
  // Load toolbar settings
  await loadToolbarSettings();
  
  // Initialize toolbar
  initToolbar();
  
  // Detect current game
  const currentGame = detectCurrentGame(window.location.href);
  state.currentGame = currentGame;
  
  if (currentGame) {
    // eslint-disable-next-line no-console
    console.log(`[Stake] Detected game: ${currentGame}`);
    await loadGameModule(currentGame);
  }
  
  // Listen for URL changes (SPA navigation)
  observeUrlChanges();
}

/**
 * Initialize site-wide toolbar
 */
function initToolbar() {
  if (!state.siteWideSettings.toolbarEnabled) {
    return;
  }
  
  // Create toolbar container
  const toolbarContainer = document.createElement('div');
  toolbarContainer.id = 'stake-toolbar-root';
  document.body.appendChild(toolbarContainer);
  
  // Render toolbar
  render(h(Toolbar, {}), toolbarContainer);
  state.toolbarVisible = true;
  
  // eslint-disable-next-line no-console
  console.log('[Stake] Toolbar initialized');
}

/**
 * Load game-specific module
 * @param {string} gameName - Name of the game (e.g., 'keno')
 */
async function loadGameModule(gameName) {
  if (!gameModules[gameName]) {
    try {
      // Lazy load game module
      if (gameName === 'keno') {
        const kenoModule = await import('../games/keno/content.js');
        gameModules[gameName] = kenoModule;
        
        // Initialize game module
        if (typeof kenoModule.init === 'function') {
          kenoModule.init();
        }
      }
    } catch (error) {
      console.error(`[Stake] Failed to load ${gameName} module:`, error);
    }
  }
}

/**
 * Observe URL changes for SPA navigation
 */
function observeUrlChanges() {
  let lastUrl = window.location.href;
  
  const observer = new MutationObserver(() => {
    const currentUrl = window.location.href;
    if (currentUrl !== lastUrl) {
      lastUrl = currentUrl;
      handleUrlChange(currentUrl);
    }
  });
  
  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });
}

/**
 * Handle URL change events
 * @param {string} url - New URL
 */
function handleUrlChange(url) {
  const newGame = detectCurrentGame(url);
  
  if (newGame !== state.currentGame) {
    // eslint-disable-next-line no-console
    console.log(`[Stake] Game changed: ${state.currentGame} → ${newGame}`);
    state.currentGame = newGame;
    
    if (newGame) {
      loadGameModule(newGame);
    }
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initSiteWide);
} else {
  initSiteWide();
}
