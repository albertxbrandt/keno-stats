// src/features/comparisonBridge.js
// Bridge between legacy comparison.js API and new Preact ComparisonWindow

import { render } from 'preact';
import { ComparisonWindow } from '../ui/components/modals/ComparisonWindow.jsx';
import { state } from '../core/state.js';
import betMultis from '../../config/bet-multis.json';

let comparisonRoot = null;

/**
 * Calculate profit for a prediction based on hits and difficulty
 */
function calculateProfit(patternSize, hits, difficulty) {
  try {
    const difficultyData = betMultis[difficulty];
    if (!difficultyData) return 0;

    const patternData = difficultyData[patternSize.toString()];
    if (!patternData) return 0;

    const multiplier = patternData[hits.toString()];
    return multiplier || 0;
  } catch (e) {
    console.error('[Comparison] Profit calculation error:', e);
    return 0;
  }
}

/**
 * Detect game difficulty from UI
 */
function detectGameDifficulty() {
  try {
    const difficultySelect = document.querySelector('select[data-testid="game-difficulty"]');
    if (difficultySelect && difficultySelect.value) {
      const newDifficulty = difficultySelect.value;
      if (state.gameDifficulty !== newDifficulty) {
        state.gameDifficulty = newDifficulty;
      }
    }
  } catch {
    // Silently fail
  }
}

/**
 * Initialize comparison window
 */
export function initComparisonWindow() {
  // Create container for Preact component
  let container = document.getElementById('keno-comparison-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'keno-comparison-container';
    document.body.appendChild(container);
  }

  // Expose toggle function globally
  window.__keno_toggleComparison = toggleComparisonWindow;
  window.__keno_trackRound = trackRoundComparison;

  // Start difficulty detection
  detectGameDifficulty();
  setInterval(detectGameDifficulty, 2000);
}

/**
 * Toggle comparison window visibility
 */
export function toggleComparisonWindow(show) {
  const shouldShow = show !== undefined ? show : !state.isComparisonWindowOpen;
  state.isComparisonWindowOpen = shouldShow;

  const container = document.getElementById('keno-comparison-container');
  if (!container) return;

  if (shouldShow) {
    // Render Preact component
    render(
      <ComparisonWindow onClose={() => toggleComparisonWindow(false)} />,
      container
    );
    comparisonRoot = container;
  } else {
    // Unmount Preact component
    render(null, container);
    comparisonRoot = null;
  }
}

/**
 * Track a round for comparison
 */
export function trackRoundComparison(roundData) {
  if (!state.isComparisonWindowOpen) return;

  const { drawn, predictions } = roundData;
  if (!drawn || drawn.length === 0 || !predictions) return;

  const count = state.generatorCount || 3;
  const difficulty = state.gameDifficulty || 'classic';

  // Calculate hits and profit for each method
  const methods = ['frequency', 'cold', 'mixed', 'average', 'momentum', 'auto', 'shapes'];
  const dataPoint = {
    round: state.currentHistory.length,
    difficulty
  };

  methods.forEach(method => {
    const predicted = predictions[method] || [];
    const hits = predicted.filter(n => drawn.includes(n)).length;
    const profit = calculateProfit(count, hits, difficulty);

    dataPoint[method] = {
      predicted,
      hits,
      count,
      profit
    };
  });

  state.comparisonData.push(dataPoint);

  // Trim to lookback size
  if (state.comparisonData.length > state.comparisonLookback) {
    state.comparisonData.shift();
  }

  // Re-render component to update with new data
  if (comparisonRoot) {
    render(
      <ComparisonWindow onClose={() => toggleComparisonWindow(false)} />,
      comparisonRoot
    );
  }
}
