/**
 * URL detection utilities for identifying current game
 */

const GAME_PATTERNS = {
  keno: /\/casino\/games\/keno/i,
  dice: /\/casino\/games\/dice/i,
  plinko: /\/casino\/games\/plinko/i,
  mines: /\/casino\/games\/mines/i,
  // Add more games as needed
};

/**
 * Detect which game is currently active based on URL
 * @param {string} url - Current page URL
 * @returns {string|null} Game name or null if not on a game page
 */
export function detectCurrentGame(url) {
  for (const [gameName, pattern] of Object.entries(GAME_PATTERNS)) {
    if (pattern.test(url)) {
      return gameName;
    }
  }
  return null;
}

/**
 * Check if URL is a Keno game page
 * @param {string} url - URL to check
 * @returns {boolean}
 */
export function isKenoPage(url) {
  return GAME_PATTERNS.keno.test(url);
}

/**
 * Check if URL is any supported game page
 * @param {string} url - URL to check
 * @returns {boolean}
 */
export function isGamePage(url) {
  return detectCurrentGame(url) !== null;
}
