// src/features/savedNumbersBridge.js - Bridge between legacy savedNumbers.js and Preact components
import { h, render } from 'preact';
import { SavedNumbersModal } from '../ui/components/modals/SavedNumbersModal.jsx';
import { CombinationHitsModal } from '../ui/components/modals/CombinationHitsModal.jsx';
import {
  getSavedNumbers,
  deleteSavedNumber,
  saveNumberCombination,
  analyzeCombinationHits,
  generatePayoutGraph,
  getGraphPreferences,
  saveGraphPreferences,
  trackPlayedNumbers,
  getRecentlyPlayed
} from './savedNumbersCore.js';
import { waitForBetButtonReady } from '../utils/utils.js';
import { replaceSelection } from '../utils/tileSelection.js';

// Container for saved numbers modals
let savedNumbersContainer = null;

/**
 * Initialize saved numbers modals container
 */
export function initSavedNumbersModals() {
  if (!savedNumbersContainer) {
    savedNumbersContainer = document.createElement('div');
    savedNumbersContainer.id = 'keno-saved-numbers-modals';
    document.body.appendChild(savedNumbersContainer);
  }
}

/**
 * Select numbers on the board
 * @param {Array<number>} numbers - Numbers to select
 */
async function selectNumbers(numbers) {
  try {
    await waitForBetButtonReady(3000);
    await replaceSelection(numbers);
  } catch (err) {
    console.warn('[SavedNumbers Bridge] Failed to select numbers:', err);
  }
}

/**
 * Show saved numbers modal
 */
export function showSavedNumbersModal() {
  if (!savedNumbersContainer) initSavedNumbersModals();

  getSavedNumbers().then((savedNumbers) => {
    const handleClose = () => {
      render(null, savedNumbersContainer);
    };

    const handleSelect = (numbers) => {
      selectNumbers(numbers);
    };

    const handleDelete = (id) => {
      return deleteSavedNumber(id);
    };

    const handleInfo = (numbers, name) => {
      // Close saved numbers modal and show hits modal
      render(null, savedNumbersContainer);
      showCombinationHitsModal(numbers, name);
    };

    render(
      h(SavedNumbersModal, {
        savedNumbers,
        onClose: handleClose,
        onSelect: handleSelect,
        onDelete: handleDelete,
        onInfo: handleInfo
      }),
      savedNumbersContainer
    );
  });
}

/**
 * Show combination hits modal
 * @param {Array<number>} numbers - Numbers to analyze
 * @param {string} comboName - Name of the combination
 */
export function showCombinationHitsModal(numbers, comboName) {
  if (!savedNumbersContainer) initSavedNumbersModals();

  // Get saved preferences and hits
  Promise.all([getGraphPreferences(), Promise.resolve(analyzeCombinationHits(numbers))]).then(
    ([prefs, hits]) => {
      const initialRiskMode = prefs.riskMode;
      const initialLookback = prefs.lookback;

      const renderModal = (riskMode, lookback) => {
        const graphHtml = generatePayoutGraph(numbers, lookback, riskMode);

        const handleClose = () => {
          render(null, savedNumbersContainer);
        };

        const handleRiskModeChange = (newMode) => {
          saveGraphPreferences(newMode, lookback);
          renderModal(newMode, lookback);
        };

        const handleLookbackChange = (newLookback) => {
          saveGraphPreferences(riskMode, newLookback);
          renderModal(riskMode, newLookback);
        };

        render(
          h(CombinationHitsModal, {
            numbers,
            comboName,
            hits,
            payoutGraphHtml: graphHtml,
            onClose: handleClose,
            onRiskModeChange: handleRiskModeChange,
            onLookbackChange: handleLookbackChange,
            initialRiskMode: riskMode,
            initialLookback: lookback
          }),
          savedNumbersContainer
        );
      };

      renderModal(initialRiskMode, initialLookback);
    }
  );
}

/**
 * Update recently played UI
 */
export function updateRecentPlayedUI() {
  const container = document.getElementById('recent-played-container');
  if (!container) return;

  getRecentlyPlayed().then((recentlyPlayed) => {
    // Clear container
    container.innerHTML = '';

    if (recentlyPlayed.length === 0) {
      const emptyDiv = document.createElement('div');
      emptyDiv.style.cssText =
        'color:#666; font-size:10px; padding:8px; text-align:center;';
      emptyDiv.textContent = 'No recent plays';
      container.appendChild(emptyDiv);
      return;
    }

    // Create elements for each recent play
    recentlyPlayed.forEach((play) => {
      const div = document.createElement('div');
      div.style.cssText =
        'display: flex; align-items: center; justify-content: space-between; padding: 6px 8px; background: #0f212e; border-radius: 4px; cursor: pointer; transition: background 0.2s;';
      div.onmouseenter = () => (div.style.background = '#1a2c38');
      div.onmouseleave = () => (div.style.background = '#0f212e');

      const numbersSpan = document.createElement('span');
      numbersSpan.style.cssText = 'color: #fff; font-size: 11px; font-weight: bold;';
      numbersSpan.textContent = play.numbers.join(', ');

      const timeSpan = document.createElement('span');
      timeSpan.style.cssText = 'color: #666; font-size: 9px;';
      const timeAgo = Math.floor((Date.now() - play.playedAt) / 1000 / 60);
      timeSpan.textContent = timeAgo < 1 ? 'just now' : `${timeAgo}m ago`;

      div.appendChild(numbersSpan);
      div.appendChild(timeSpan);

      div.addEventListener('click', () => selectNumbers(play.numbers));

      container.appendChild(div);
    });
  });
}

// Expose functions globally
window.__keno_showSavedNumbers = showSavedNumbersModal;
window.__keno_updateRecentPlayed = updateRecentPlayedUI;
window.__keno_selectNumbers = selectNumbers;
window.__keno_analyzeCombination = showCombinationHitsModal;

// Export for other modules
export { saveNumberCombination, trackPlayedNumbers, getSavedNumbers, getRecentlyPlayed };
