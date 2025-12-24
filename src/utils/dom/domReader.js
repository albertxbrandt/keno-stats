/**
 * DOM Reader Utility Module
 * 
 * Provides standardized helper functions for reading data from UI elements.
 * Use these functions throughout the codebase to maintain consistency and reduce duplication.
 * 
 * @module domReader
 * 
 * Categories:
 * - Input value readers (getInputValue, getIntValue, getFloatValue, getCheckboxValue, getSelectValue)
 * - Text content readers (getTextContent, getTileNumber)
 * - Attribute readers (getAttributeValue, isElementDisabled)
 * - Multi-element readers (getAllInputValues, getAllCheckboxStates)
 * - Game-specific readers (getSelectedTileNumbers, getTileCount, getBetButtonState)
 * 
 * @example
 * // Instead of: const value = parseInt(document.getElementById('my-input').value) || 0;
 * // Use: const value = getIntValue('my-input', 0);
 * 
 * @example
 * // Instead of: const checked = document.getElementById('my-checkbox').checked;
 * // Use: const checked = getCheckboxValue('my-checkbox');
 */

// ============================================================================
// INPUT VALUE READERS
// ============================================================================

/**
 * Get value from an input element
 * @param {string|HTMLElement} elementOrId - Element ID or HTMLElement
 * @param {string} [defaultValue=''] - Default value if element not found or empty
 * @returns {string} Input value or default
 * 
 * @example
 * const username = getInputValue('username-input', 'Guest');
 */
export function getInputValue(elementOrId, defaultValue = '') {
  const element = typeof elementOrId === 'string'
    ? document.getElementById(elementOrId)
    : elementOrId;

  if (!element) return defaultValue;
  return element.value !== undefined ? element.value : defaultValue;
}

/**
 * Get integer value from an input element with validation
 * @param {string|HTMLElement} elementOrId - Element ID or HTMLElement
 * @param {number} [defaultValue=0] - Default value if element not found or invalid
 * @param {Object} [options={}] - Validation options
 * @param {number} [options.min] - Minimum allowed value (clamps result)
 * @param {number} [options.max] - Maximum allowed value (clamps result)
 * @returns {number} Parsed and validated integer value
 * 
 * @example
 * // Get value clamped between 1 and 40
 * const count = getIntValue('prediction-count', 3, { min: 1, max: 40 });
 */
export function getIntValue(elementOrId, defaultValue = 0, options = {}) {
  const element = typeof elementOrId === 'string'
    ? document.getElementById(elementOrId)
    : elementOrId;

  if (!element) return defaultValue;

  let value = parseInt(element.value, 10);
  if (isNaN(value)) return defaultValue;

  // Apply min/max constraints if provided
  if (options.min !== undefined && value < options.min) value = options.min;
  if (options.max !== undefined && value > options.max) value = options.max;

  return value;
}

/**
 * Get float value from an input element with validation
 * @param {string|HTMLElement} elementOrId - Element ID or HTMLElement
 * @param {number} [defaultValue=0.0] - Default value if element not found or invalid
 * @param {Object} [options={}] - Validation options
 * @param {number} [options.min] - Minimum allowed value (clamps result)
 * @param {number} [options.max] - Maximum allowed value (clamps result)
 * @returns {number} Parsed and validated float value
 * 
 * @example
 * const threshold = getFloatValue('momentum-threshold', 1.5, { min: 1.0, max: 3.0 });
 */
export function getFloatValue(elementOrId, defaultValue = 0.0, options = {}) {
  const element = typeof elementOrId === 'string'
    ? document.getElementById(elementOrId)
    : elementOrId;

  if (!element) return defaultValue;

  let value = parseFloat(element.value);
  if (isNaN(value)) return defaultValue;

  // Apply min/max constraints if provided
  if (options.min !== undefined && value < options.min) value = options.min;
  if (options.max !== undefined && value > options.max) value = options.max;

  return value;
}

/**
 * Get checkbox checked state
 * @param {string|HTMLElement} elementOrId - Element ID or HTMLElement
 * @param {boolean} [defaultValue=false] - Default value if element not found
 * @returns {boolean} Checkbox checked state
 * 
 * @example
 * const isAutoSelectEnabled = getCheckboxValue('generator-auto-select-switch');
 */
export function getCheckboxValue(elementOrId, defaultValue = false) {
  const element = typeof elementOrId === 'string'
    ? document.getElementById(elementOrId)
    : elementOrId;

  if (!element) return defaultValue;
  return !!element.checked;
}

/**
 * Get selected value from a select element
 * @param {string|HTMLElement} elementOrId - Element ID or HTMLElement
 * @param {string} [defaultValue=''] - Default value if element not found
 * @returns {string} Selected option value
 * 
 * @example
 * const generatorMethod = getSelectValue('generator-method-select', 'frequency');
 */
export function getSelectValue(elementOrId, defaultValue = '') {
  const element = typeof elementOrId === 'string'
    ? document.getElementById(elementOrId)
    : elementOrId;

  if (!element) return defaultValue;
  return element.value || defaultValue;
}

// ============================================================================
// TEXT CONTENT READERS
// ============================================================================

/**
 * Get text content from an element
 * @param {string|HTMLElement} elementOrId - Element ID or HTMLElement
 * @param {Object} [options={}] - Reading options
 * @param {boolean} [options.trim=true] - Whether to trim whitespace
 * @param {string} [options.defaultValue=''] - Default value if element not found
 * @returns {string} Element text content
 * 
 * @example
 * const statusText = getTextContent('autoplay-status', { trim: true, defaultValue: 'Ready' });
 */
export function getTextContent(elementOrId, options = {}) {
  const { trim = true, defaultValue = '' } = options;

  const element = typeof elementOrId === 'string'
    ? document.getElementById(elementOrId)
    : elementOrId;

  if (!element) return defaultValue;

  const text = element.textContent || '';
  return trim ? text.trim() : text;
}

/**
 * Get number from a tile element (strips % signs and parses)
 * Keno tiles display as "12%" or "12" - this extracts just the number
 * @param {HTMLElement} tileElement - Tile button element
 * @returns {number|null} Tile number (1-40) or null if invalid
 * 
 * @example
 * const tiles = document.querySelectorAll('button');
 * const number = getTileNumber(tiles[0]); // Returns number from tile
 */
export function getTileNumber(tileElement) {
  if (!tileElement) return null;

  const text = (tileElement.textContent || '').trim();
  // Strip percentage sign if present (e.g., "12%" -> "12")
  const numText = text.split('%')[0];
  const num = parseInt(numText, 10);

  return isNaN(num) ? null : num;
}

// ============================================================================
// ATTRIBUTE READERS
// ============================================================================

/**
 * Get attribute value from an element
 * @param {string|HTMLElement} elementOrId - Element ID or HTMLElement
 * @param {string} attributeName - Attribute name to read
 * @param {string|null} [defaultValue=null] - Default value if attribute not found
 * @returns {string|null} Attribute value or default
 * 
 * @example
 * const isPressed = getAttributeValue(tileButton, 'aria-pressed') === 'true';
 */
export function getAttributeValue(elementOrId, attributeName, defaultValue = null) {
  const element = typeof elementOrId === 'string'
    ? document.getElementById(elementOrId)
    : elementOrId;

  if (!element) return defaultValue;

  const value = element.getAttribute(attributeName);
  return value !== null ? value : defaultValue;
}

/**
 * Check if an element is disabled (multiple methods)
 * Checks disabled property, disabled attribute, and aria-disabled
 * @param {string|HTMLElement} elementOrId - Element ID or HTMLElement
 * @returns {boolean} True if element is disabled
 * 
 * @example
 * if (!isElementDisabled('bet-button')) {
 *   // Button is enabled, safe to click
 * }
 */
export function isElementDisabled(elementOrId) {
  const element = typeof elementOrId === 'string'
    ? document.getElementById(elementOrId)
    : elementOrId;

  if (!element) return true; // Treat missing elements as disabled

  return element.disabled ||
    element.getAttribute('disabled') !== null ||
    element.getAttribute('aria-disabled') === 'true' ||
    element.classList.contains('disabled');
}

// ============================================================================
// MULTI-ELEMENT READERS
// ============================================================================

/**
 * Get values from multiple input elements by ID
 * @param {string[]} elementIds - Array of element IDs
 * @param {string} [defaultValue=''] - Default value for missing elements
 * @returns {Object} Map of elementId -> value
 * 
 * @example
 * const values = getAllInputValues(['name', 'email', 'age']);
 * // Returns: { name: 'John', email: 'john@example.com', age: '25' }
 */
export function getAllInputValues(elementIds, defaultValue = '') {
  const result = {};
  elementIds.forEach(id => {
    result[id] = getInputValue(id, defaultValue);
  });
  return result;
}

/**
 * Get checked state of multiple checkboxes by ID
 * @param {string[]} elementIds - Array of checkbox element IDs
 * @returns {Object} Map of elementId -> checked state
 * 
 * @example
 * const visibility = getAllCheckboxStates(['show-date', 'show-amount', 'show-hits']);
 * // Returns: { 'show-date': true, 'show-amount': false, 'show-hits': true }
 */
export function getAllCheckboxStates(elementIds) {
  const result = {};
  elementIds.forEach(id => {
    result[id] = getCheckboxValue(id, false);
  });
  return result;
}

// ============================================================================
// GAME-SPECIFIC READERS (Keno UI)
// ============================================================================

/**
 * Get currently selected tile numbers from the game board
 * Checks multiple selection indicators: aria-pressed, aria-checked, classes, data attributes
 * @returns {number[]} Array of selected tile numbers (1-40), sorted ascending
 * 
 * @example
 * const selected = getSelectedTileNumbers();
 * console.log(`Player selected ${selected.length} numbers:`, selected);
 */
export function getSelectedTileNumbers() {
  try {
    const tilesContainer = document.querySelector('div[data-testid="game-keno"]');
    if (!tilesContainer) return [];

    const tiles = Array.from(tilesContainer.querySelectorAll('button'));
    const selectedNumbers = [];

    tiles.forEach((tile, index) => {
      const isSelected =
        tile.getAttribute('aria-pressed') === 'true' ||
        tile.getAttribute('aria-checked') === 'true' ||
        /\bselected\b|\bactive\b|\bis-active\b|\bpicked\b|\bchosen\b/i.test(tile.className || '') ||
        (tile.dataset && (tile.dataset.selected === 'true' || tile.dataset.active === 'true'));

      if (isSelected) {
        // Tiles are 1-40, index is 0-39
        selectedNumbers.push(index + 1);
      }
    });

    return selectedNumbers.sort((a, b) => a - b);
  } catch (error) {
    console.error('[domReader] Error getting selected tiles:', error);
    return [];
  }
}

/**
 * Get count of currently selected tiles
 * @returns {number} Number of selected tiles (0-40)
 * 
 * @example
 * const count = getSelectedTileCount();
 * if (count < 3) alert('Please select at least 3 numbers');
 */
export function getSelectedTileCount() {
  return getSelectedTileNumbers().length;
}

/**
 * Get Keno game container element
 * @returns {HTMLElement|null} The game container element or null if not found
 * 
 * @example
 * const container = getKenoContainer();
 * if (container) {
 *   console.log('Game container found');
 * }
 */
export function getKenoContainer() {
  return document.querySelector('div[data-testid="game-keno"]');
}

/**
 * Get all tile elements from the game board as NodeList
 * @returns {NodeList|null} NodeList of tile button elements, or null if container not found
 * 
 * @example
 * const tiles = getTileElements();
 * if (tiles) {
 *   tiles.forEach(tile => console.log(getTileNumber(tile)));
 * }
 */
export function getTileElements() {
  const container = getKenoContainer();
  return container ? container.querySelectorAll('button') : null;
}

/**
 * Get all tile elements from the game board as Array
 * @returns {HTMLElement[]|null} Array of tile button elements, or null if container not found
 * 
 * @example
 * const tiles = getAllTileElements();
 * if (tiles) {
 *   tiles.forEach(tile => console.log(getTileNumber(tile)));
 * }
 */
export function getAllTileElements() {
  const container = getKenoContainer();
  if (!container) return null;
  return Array.from(container.querySelectorAll('button'));
}

/**
 * Get total count of tiles on the game board (should be 40 for Keno)
 * @returns {number} Total number of tiles, or 0 if container not found
 * 
 * @example
 * const total = getTileCount();
 * console.log(`Game board has ${total} tiles`); // Should be 40
 */
export function getTileCount() {
  const tiles = getAllTileElements();
  return tiles ? tiles.length : 0;
}

/**
 * Extract number from tile text content (handles both % and x suffixes for heatmap)
 * @param {string} text - Tile text content
 * @returns {number} Parsed number or NaN if invalid
 * 
 * @example
 * extractNumberFromTile('25%'); // Returns 25
 * extractNumberFromTile('1.5x'); // Returns 1 (just the number part)
 * extractNumberFromTile('8'); // Returns 8
 */
export function extractNumberFromTile(text) {
  const cleanText = text.trim().split('%')[0].split('x')[0];
  return parseInt(cleanText, 10);
}

/**
 * Get bet button element and its ready state
 * @returns {Object} Button state object with element reference and ready status
 * @property {HTMLElement|null} element - The bet button element
 * @property {boolean} exists - Whether button was found
 * @property {boolean} enabled - Whether button is enabled (not disabled)
 * @property {boolean} ready - Whether button has data-test-action-enabled="true"
 * 
 * @example
 * const btnState = getBetButtonState();
 * if (btnState.ready) {
 *   console.log('Ready to place bet');
 * }
 */
export function getBetButtonState() {
  const button = document.querySelector('button[data-testid="bet-button"]');

  if (!button) {
    return { element: null, exists: false, enabled: false, ready: false };
  }

  const enabled = !isElementDisabled(button);
  const ready = button.getAttribute('data-test-action-enabled') === 'true';

  return {
    element: button,
    exists: true,
    enabled,
    ready
  };
}

// ============================================================================
// CONFIGURATION READERS (Read multiple related inputs as a config object)
// ============================================================================

/**
 * Read momentum generator configuration from UI inputs
 * @returns {Object} Momentum configuration object
 * @property {number} detectionWindow - Detection window size
 * @property {number} baselineWindow - Baseline window size
 * @property {number} momentumThreshold - Momentum threshold value
 * @property {number} refreshFrequency - How often to refresh
 * @property {number} topNPool - Pool size for top numbers
 * 
 * @example
 * const config = getMomentumConfigFromUI();
 * const predictions = generator.generate(history, config);
 */
export function getMomentumConfigFromUI() {
  return {
    detectionWindow: getIntValue('momentum-detection', 5, { min: 3, max: 20 }),
    baselineWindow: getIntValue('momentum-baseline', 50, { min: 10, max: 200 }),
    momentumThreshold: getFloatValue('momentum-threshold', 1.5, { min: 1.0, max: 3.0 }),
    refreshFrequency: getIntValue('momentum-refresh', 5, { min: 1, max: 20 }),
    topNPool: getIntValue('momentum-pool', 15, { min: 5, max: 30 })
  };
}

/**
 * Read pattern analysis configuration from UI inputs
 * @returns {Object} Pattern configuration object
 * @property {number} patternSize - Size of patterns to find (3-10)
 * @property {number} sampleSize - Number of games to analyze
 * @property {number} minHits - Minimum hits filter
 * @property {number} maxHits - Maximum hits filter
 * @property {number} notHitIn - Not hit in last N games filter
 * @property {boolean} requireBuildups - Whether to require buildup patterns
 * @property {string} sortBy - Sort method ('frequency' or 'recent')
 * 
 * @example
 * const config = getPatternConfigFromUI();
 * const patterns = findCommonPatterns(config.patternSize, 15, config);
 */
export function getPatternConfigFromUI() {
  return {
    patternSize: getIntValue('live-pattern-size', 5, { min: 3, max: 10 }),
    sampleSize: getIntValue('live-sample-size', 100, { min: 1 }),
    minHits: getIntValue('live-min-hits', 3, { min: 0 }),
    maxHits: getIntValue('live-max-hits', 10, { min: 0 }),
    notHitIn: getIntValue('live-not-hit-in', 0, { min: 0 }),
    requireBuildups: getCheckboxValue('live-require-buildups', false),
    sortBy: getSelectValue('pattern-sort-select', 'frequency')
  };
}

/**
 * Read generator configuration from unified UI inputs
 * @returns {Object} Generator configuration object
 * @property {number} count - How many numbers to generate
 * @property {string} method - Generator method ('frequency', 'cold', 'mixed', etc.)
 * @property {number} sampleSize - Sample size for frequency-based methods
 * @property {boolean} autoSelect - Whether to auto-select generated numbers
 * 
 * @example
 * const config = getGeneratorConfigFromUI();
 * const numbers = generateNumbers(config);
 */
export function getGeneratorConfigFromUI() {
  return {
    count: getIntValue('generator-count', 3, { min: 1, max: 40 }),
    method: getSelectValue('generator-method-select', 'frequency'),
    sampleSize: getIntValue('frequency-sample-size', 5, { min: 1 }),
    autoSelect: getCheckboxValue('generator-auto-select-switch', false),
    interval: getIntValue('generator-interval-input', 0, { min: 0, max: 100 })
  };
}

/**
 * Read auto-play configuration from UI inputs
 * @returns {Object} Auto-play configuration object
 * @property {number} rounds - Number of rounds to play
 * @property {number} predictionCount - How many numbers to predict
 * @property {string} method - Prediction method to use
 * 
 * @example
 * const config = getAutoPlayConfigFromUI();
 * startAutoPlay(config);
 */
export function getAutoPlayConfigFromUI() {
  return {
    rounds: getIntValue('autoplay-rounds-input', 5, { min: 1 }),
    predictionCount: getIntValue('autoplay-pred-count', 3, { min: 1, max: 40 }),
    method: getSelectValue('generator-method-select', 'frequency')
  };
}

/**
 * Read heatmap configuration from UI inputs
 * @returns {Object} Heatmap configuration object
 * @property {number} sampleSize - Number of games to analyze
 * @property {boolean} active - Whether heatmap is active
 * 
 * @example
 * const config = getHeatmapConfigFromUI();
 * updateHeatmap(config);
 */
export function getHeatmapConfigFromUI() {
  return {
    sampleSize: getIntValue('heatmap-sample-size', 100, { min: 1 }),
    active: getCheckboxValue('heatmap-switch', false)
  };
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Wait for an element to appear in the DOM
 * @param {string} selector - CSS selector for the element
 * @param {number} [timeout=5000] - Maximum time to wait in milliseconds
 * @returns {Promise<HTMLElement|null>} Resolves with element when found, or null on timeout
 * 
 * @example
 * const button = await waitForElement('button[data-testid="bet-button"]');
 * if (button) simulateClick(button);
 */
export function waitForElement(selector, timeout = 5000) {
  return new Promise((resolve) => {
    const element = document.querySelector(selector);
    if (element) {
      resolve(element);
      return;
    }

    const observer = new MutationObserver(() => {
      const element = document.querySelector(selector);
      if (element) {
        observer.disconnect();
        resolve(element);
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    setTimeout(() => {
      observer.disconnect();
      resolve(null);
    }, timeout);
  });
}

/**
 * Check if element exists in DOM
 * @param {string} selector - CSS selector or element ID (will try both)
 * @returns {boolean} True if element exists
 * 
 * @example
 * if (elementExists('autoplay-status')) {
 *   updateStatus('Playing...');
 * }
 */
export function elementExists(selector) {
  // Try as ID first
  if (document.getElementById(selector)) return true;
  // Try as selector
  return document.querySelector(selector) !== null;
}
