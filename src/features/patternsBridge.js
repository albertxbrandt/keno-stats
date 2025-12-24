// src/features/patternsBridge.js - Bridge between legacy patterns.js and Preact components
import { h, render } from 'preact';
import { PatternLoadingModal } from '../ui/components/modals/PatternLoadingModal.jsx';
import { PatternAnalysisModal } from '../ui/components/modals/PatternAnalysisModal.jsx';
import { saveNumberCombination } from './savedNumbers.js';
import { waitForBetButtonReady } from '../utils/utils.js';
import { replaceSelection } from '../utils/tileSelection.js';

// Container for pattern modals
let patternContainer = null;

/**
 * Initialize pattern modals container
 */
export function initPatternModals() {
  if (!patternContainer) {
    patternContainer = document.createElement('div');
    patternContainer.id = 'keno-pattern-modals';
    document.body.appendChild(patternContainer);
  }
}

/**
 * Show loading modal
 */
export function showLoadingModal() {
  if (!patternContainer) initPatternModals();
  render(h(PatternLoadingModal, {}), patternContainer);
}

/**
 * Hide loading modal
 */
export function hideLoadingModal() {
  if (patternContainer) {
    render(null, patternContainer);
  }
}

/**
 * Select pattern numbers on the board
 * @param {Array<number>} numbers - Numbers to select
 */
async function selectPatternNumbers(numbers) {
  try {
    await waitForBetButtonReady(3000);
    await replaceSelection(numbers);
  } catch (err) {
    console.warn('[Pattern Bridge] Failed to select numbers:', err);
  }
}

/**
 * Show pattern analysis modal
 * @param {number} patternSize - Pattern size (3-10)
 * @param {Array} patterns - Pattern results
 * @param {Object} stats - Statistics
 * @param {string} sortBy - Sort method
 * @param {number} sampleSize - Sample size
 * @param {Function} onRefresh - Callback to refresh with new filters
 */
export function showPatternModal(patternSize, patterns, stats, sortBy, sampleSize, onRefresh) {
  if (!patternContainer) initPatternModals();

  const handleClose = () => {
    render(null, patternContainer);
  };

  const handleSelectNumbers = (numbers) => {
    selectPatternNumbers(numbers);
  };

  const handleSavePattern = (numbers, name) => {
    return saveNumberCombination(numbers, name);
  };

  render(
    h(PatternAnalysisModal, {
      patternSize,
      patterns,
      stats,
      sortBy,
      sampleSize,
      onClose: handleClose,
      onRefresh,
      onSelectNumbers: handleSelectNumbers,
      onSavePattern: handleSavePattern
    }),
    patternContainer
  );
}

// Export legacy patterns.js functions that are still needed
export {
  // Pattern cache management
  clearPatternCache,
  // Pattern finding algorithm
  findCommonPatterns,
  getPatternStats,
  // Main entry point
  showPatternAnalysisModal
} from './patternsCore.js';
