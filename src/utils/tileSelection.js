// src/tileSelection.js
// Shared utilities for selecting and deselecting Keno game tiles

import { simulatePointerClick } from './utils.js';

/**
 * Get all tile buttons from the game board
 * @returns {Array<HTMLElement>|null} Array of tile buttons or null if container not found
 */
export function getAllTiles() {
  const container = document.querySelector('div[data-testid="game-keno"]');
  if (!container) {
    console.error('[tileSelection] Game container not found');
    return null;
  }
  return Array.from(container.querySelectorAll('button'));
}

/**
 * Find a specific tile by its number
 * @param {Array<HTMLElement>} tiles - Array of tile elements
 * @param {number} num - The number to find (1-40)
 * @returns {HTMLElement|undefined} The tile element or undefined
 */
export function findTileByNumber(tiles, num) {
  return tiles.find(t => {
    const text = (t.textContent || '').trim().split('%')[0];
    return parseInt(text) === num;
  });
}

/**
 * Check if a tile is currently selected
 * @param {HTMLElement} tile - The tile element to check
 * @returns {boolean}
 */
export function isTileSelected(tile) {
  if (!tile) return false;
  const classList = Array.from(tile.classList);
  return classList.some(cls =>
    cls.includes('selected') ||
    cls.includes('active') ||
    cls.includes('picked') ||
    cls.includes('chosen')
  );
}

/**
 * Select a single tile
 * @param {HTMLElement} tile - The tile to select
 * @param {number} num - The tile number (for logging)
 * @returns {boolean} True if successful
 */
export function selectTile(tile, num) {
  if (!tile || isTileSelected(tile)) {
    return false;
  }

  try {
    simulatePointerClick(tile);
    return true;
  } catch (e) {
    try {
      tile.click();
      return true;
    } catch (err) {
      console.error(`[tileSelection] Failed to click tile ${num}:`, err);
      return false;
    }
  }
}

/**
 * Deselect a single tile
 * @param {HTMLElement} tile - The tile to deselect
 * @returns {boolean} True if successful
 */
export function deselectTile(tile) {
  if (!tile || !isTileSelected(tile)) {
    return false;
  }

  try {
    simulatePointerClick(tile);
  } catch (e) {
    try {
      tile.click();
    } catch { }
  }

  // Clear highlight styles
  tile.style.boxShadow = '';
  tile.style.transform = '';
  tile.style.opacity = '1';

  return true;
}

/**
 * Deselect all selected tiles on the board
 * @param {Array<HTMLElement>} tiles - Array of all tile elements
 */
export function deselectAllTiles(tiles) {
  const selected = tiles.filter(isTileSelected);
  selected.forEach(tile => deselectTile(tile));
}

/**
 * Select multiple tiles by their numbers
 * @param {Array<number>} numbers - Array of numbers to select (1-40)
 * @returns {Object} { selected: number, failed: Array<number> }
 */
export function selectTiles(numbers) {
  const tiles = getAllTiles();
  if (!tiles) {
    return { selected: 0, failed: numbers };
  }

  const failed = [];
  let selected = 0;

  numbers.forEach(num => {
    const tile = findTileByNumber(tiles, num);
    if (selectTile(tile, num)) {
      selected++;
    } else {
      failed.push(num);
    }
  });

  return { selected, failed };
}

/**
 * Replace current selection with new numbers
 * Deselects all tiles, then selects the specified numbers
 * @param {Array<number>} numbers - Array of numbers to select (1-40)
 * @returns {Object} { selected: number, failed: Array<number> }
 */
export function replaceSelection(numbers) {
  const tiles = getAllTiles();
  if (!tiles) {
    return { selected: 0, failed: numbers };
  }

  // Deselect all first
  deselectAllTiles(tiles);

  // Select new numbers
  const failed = [];
  let selected = 0;

  numbers.forEach(num => {
    const tile = findTileByNumber(tiles, num);
    if (selectTile(tile, num)) {
      selected++;
    } else {
      failed.push(num);
    }
  });

  return { selected, failed };
}
