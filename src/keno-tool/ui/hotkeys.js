// src/ui/hotkeys.js
// Reusable keyboard shortcut system
// Centralized hotkey management with easy registration

/**
 * Hotkey registry
 * Maps key codes to handler functions
 */
const hotkeyRegistry = new Map();

/**
 * Register a hotkey handler
 * @param {string} key - Key to listen for (case-insensitive, e.g., 'b', 'enter', 'escape')
 * @param {Function} handler - Function to call when key is pressed
 * @param {Object} options - Configuration options
 * @param {boolean} options.preventDefault - Prevent default browser behavior (default: true)
 * @param {boolean} options.requireKeno - Only trigger on Keno page (default: true)
 * @param {string} options.description - Description for documentation
 */
export function registerHotkey(key, handler, options = {}) {
  const config = {
    preventDefault: options.preventDefault !== false,
    requireKeno: options.requireKeno !== false,
    description: options.description || '',
    handler
  };

  const normalizedKey = key.toLowerCase();
  hotkeyRegistry.set(normalizedKey, config);
}

/**
 * Unregister a hotkey
 * @param {string} key - Key to unregister
 */
export function unregisterHotkey(key) {
  const normalizedKey = key.toLowerCase();
  hotkeyRegistry.delete(normalizedKey);
}

/**
 * Initialize the hotkey system
 * Sets up the global keydown listener
 */
export function initHotkeys() {
  document.addEventListener('keydown', (e) => {
    // Ignore if typing in input/textarea
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

    const normalizedKey = e.key.toLowerCase();
    const config = hotkeyRegistry.get(normalizedKey);

    if (!config) return;

    // Check if on Keno page if required
    if (config.requireKeno && !window.location.href.includes('keno')) return;

    // Prevent default if configured
    if (config.preventDefault) {
      e.preventDefault();
    }

    // Call the handler
    try {
      config.handler(e);
    } catch (err) {
      console.error(`[Hotkey] Error executing handler for key '${e.key}':`, err);
    }
  });
}

/**
 * Get all registered hotkeys (for debugging/documentation)
 * @returns {Array<{key: string, description: string}>}
 */
export function getRegisteredHotkeys() {
  const hotkeys = [];
  for (const [key, config] of hotkeyRegistry) {
    hotkeys.push({
      key: key.toUpperCase(),
      description: config.description,
      requireKeno: config.requireKeno
    });
  }
  return hotkeys;
}
