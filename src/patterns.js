// src/patterns.js - Pattern analysis for finding common number combinations
import { state } from './state.js';
import { getDrawn } from './storage.js';

/**
 * Generate all combinations of size k from an array
 */
function getCombinations(arr, k) {
  const result = [];

  function backtrack(start, current) {
    if (current.length === k) {
      result.push([...current]);
      return;
    }

    for (let i = start; i < arr.length; i++) {
      current.push(arr[i]);
      backtrack(i + 1, current);
      current.pop();
    }
  }

  backtrack(0, []);
  return result;
}

/**
 * Analyze history to find the most common patterns (number combinations) 
 * of a specific size that appear together
 * @param {number} patternSize - Size of pattern to find (3-10)
 * @param {number} topN - How many top patterns to return (default 10)
 * @returns {Array<Object>} Array of pattern objects with numbers, frequency, and occurrences
 */
export function findCommonPatterns(patternSize, topN = 10) {
  if (!patternSize || patternSize < 3 || patternSize > 10) {
    console.warn('[patterns] Invalid pattern size:', patternSize);
    return [];
  }

  const patternCounts = {}; // Map of pattern key -> { numbers: [], count: number, occurrences: [] }

  // Analyze history
  state.currentHistory.forEach((round, roundIndex) => {
    const drawnNumbers = getDrawn(round);

    // Generate all combinations of patternSize from the drawn numbers
    const combinations = getCombinations(drawnNumbers, patternSize);

    combinations.forEach(combo => {
      const sorted = combo.sort((a, b) => a - b);
      const key = sorted.join(',');

      if (!patternCounts[key]) {
        patternCounts[key] = { numbers: sorted, count: 0, occurrences: [] };
      }
      patternCounts[key].count++;
      // Store round index and timestamp
      patternCounts[key].occurrences.push({
        roundIndex,
        betNumber: roundIndex + 1,
        time: round.time,
        drawn: drawnNumbers
      });
    });
  });

  // Sort by frequency and return top N
  const sortedPatterns = Object.values(patternCounts)
    .sort((a, b) => b.count - a.count)
    .slice(0, topN);

  return sortedPatterns;
}

/**
 * Calculate statistics for a specific pattern size
 * @param {number} patternSize - Size of pattern (3-10)
 * @returns {Object} Statistics about patterns of this size
 */
export function getPatternStats(patternSize) {
  if (state.currentHistory.length === 0) return { totalCombinations: 0, avgAppearance: 0 };

  const patterns = findCommonPatterns(patternSize, 1000); // Get all patterns
  const totalCombinations = patterns.length;
  const avgAppearance = patterns.length > 0
    ? (patterns.reduce((sum, p) => sum + p.count, 0) / patterns.length).toFixed(1)
    : 0;

  return { totalCombinations, avgAppearance };
}

/**
 * Display pattern analysis results in a modal
 * @param {number} patternSize - The size of patterns to find (3-10)
 */
export function showPatternAnalysisModal(patternSize) {
  const patterns = findCommonPatterns(patternSize, 15);
  const stats = getPatternStats(patternSize);

  if (patterns.length === 0) {
    alert(`No pattern data available.\nPlay more rounds to analyze patterns of size ${patternSize}.`);
    return;
  }

  // Remove existing modal if any
  const existingModal = document.getElementById('keno-pattern-modal');
  if (existingModal) existingModal.remove();

  // Create modal
  const modal = document.createElement('div');
  modal.id = 'keno-pattern-modal';
  Object.assign(modal.style, {
    position: 'fixed',
    top: '0',
    left: '0',
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: '1000000',
    fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif'
  });

  // Create modal content
  const content = document.createElement('div');
  Object.assign(content.style, {
    backgroundColor: '#1a2c38',
    padding: '25px',
    borderRadius: '12px',
    maxWidth: '600px',
    width: '90%',
    maxHeight: '80vh',
    overflow: 'auto',
    boxShadow: '0 10px 40px rgba(0,0,0,0.5)',
    color: '#fff'
  });

  // Build content HTML
  let html = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
            <h2 style="margin: 0; color: #74b9ff; font-size: 20px;">Pattern Analysis: ${patternSize} Numbers</h2>
            <button id="close-pattern-modal" style="background: none; border: none; color: #fff; font-size: 24px; cursor: pointer; padding: 0; width: 30px; height: 30px;">✕</button>
        </div>
        
        <div style="background: #0f212e; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                <div>
                    <div style="color: #aaa; font-size: 12px; margin-bottom: 5px;">Total Patterns Found</div>
                    <div style="color: #00b894; font-size: 22px; font-weight: bold;">${stats.totalCombinations}</div>
                </div>
                <div>
                    <div style="color: #aaa; font-size: 12px; margin-bottom: 5px;">Avg Appearances</div>
                    <div style="color: #74b9ff; font-size: 22px; font-weight: bold;">${stats.avgAppearance}</div>
                </div>
            </div>
            <div style="color: #666; font-size: 11px; margin-top: 10px;">Analyzed ${state.currentHistory.length} rounds</div>
        </div>

        <div style="margin-bottom: 15px;">
            <h3 style="color: #74b9ff; font-size: 16px; margin: 0 0 15px 0;">Top ${patterns.length} Most Common Patterns</h3>
            <div style="color: #888; font-size: 12px; margin-bottom: 10px;">These ${patternSize}-number combinations appeared together most frequently:</div>
        </div>

        <div style="display: flex; flex-direction: column; gap: 10px;">
    `;

  patterns.forEach((pattern, index) => {
    const percentage = ((pattern.count / state.currentHistory.length) * 100).toFixed(1);
    const patternId = `pattern-${index}`;
    const dropdownId = `dropdown-${index}`;

    // Get last occurrence
    const lastOccurrence = pattern.occurrences[pattern.occurrences.length - 1];
    const lastBetNumber = lastOccurrence.betNumber;
    const lastTime = new Date(lastOccurrence.time).toLocaleString();

    html += `
            <div style="background: #0f212e; padding: 12px 15px; border-radius: 8px; border-left: 3px solid ${index < 3 ? '#00b894' : '#74b9ff'};">
                <div id="${patternId}" data-numbers="${pattern.numbers.join(',')}" style="display: flex; justify-content: space-between; align-items: center; cursor: pointer;" title="Click to select these numbers">
                    <div style="flex: 1;">
                        <span style="color: #aaa; font-size: 11px; margin-right: 8px;">#${index + 1}</span>
                        <span style="color: #fff; font-weight: bold; font-size: 15px;">${pattern.numbers.join(', ')}</span>
                    </div>
                    <div style="text-align: right;">
                        <div style="color: #00b894; font-weight: bold; font-size: 16px;">${pattern.count}×</div>
                        <div style="color: #888; font-size: 11px;">${percentage}%</div>
                    </div>
                </div>
                <div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid #1a2c38;">
                    <div style="display: flex; justify-content: space-between; align-items: center; cursor: pointer;" onclick="document.getElementById('${dropdownId}').style.display = document.getElementById('${dropdownId}').style.display === 'none' ? 'block' : 'none';">
                        <span style="color: #aaa; font-size: 11px;">Last seen: Bet #${lastBetNumber}</span>
                        <span style="color: #74b9ff; font-size: 11px;">▼ View all (${pattern.count})</span>
                    </div>
                    <div id="${dropdownId}" style="display: none; margin-top: 8px; max-height: 150px; overflow-y: auto; background: #14202b; border-radius: 4px; padding: 6px;">
    `;

    // Add all occurrences (most recent first)
    pattern.occurrences.slice().reverse().forEach((occurrence, occIndex) => {
      const occTime = new Date(occurrence.time).toLocaleString();
      html += `
                        <div style="padding: 4px; border-bottom: 1px solid #1a2c38; font-size: 10px;">
                            <span style="color: #00b894;">Bet #${occurrence.betNumber}</span>
                            <span style="color: #666; margin-left: 8px;">${occTime}</span>
                        </div>
      `;
    });

    html += `
                    </div>
                </div>
            </div>
        `;
  });

  html += `
        </div>
        
        <div style="margin-top: 20px; padding-top: 15px; border-top: 1px solid #333;">
            <div style="color: #666; font-size: 11px; line-height: 1.5;">
                <strong style="color: #888;">Note:</strong> Patterns show which ${patternSize}-number combinations appeared 
                together most frequently in drawn numbers. This is for analysis only and does not predict future outcomes.
            </div>
        </div>
    `;

  content.innerHTML = html;
  modal.appendChild(content);
  document.body.appendChild(modal);

  // Event listeners
  const closeBtn = document.getElementById('close-pattern-modal');
  if (closeBtn) {
    closeBtn.addEventListener('click', () => modal.remove());
  }
  modal.addEventListener('click', (e) => {
    if (e.target === modal) modal.remove();
  });

  // Add click handlers for each pattern to select numbers
  patterns.forEach((pattern, index) => {
    const patternEl = document.getElementById(`pattern-${index}`);
    if (patternEl) {
      patternEl.addEventListener('click', () => {
        selectPatternNumbers(pattern.numbers);
        // Visual feedback
        patternEl.style.backgroundColor = '#2a3b4a';
        setTimeout(() => {
          patternEl.style.backgroundColor = '';
        }, 300);
      });
    }
  });
}

/**
 * Select the given numbers on the Keno board
 * @param {Array<number>} numbers - Numbers to select (1-40)
 */
function selectPatternNumbers(numbers) {
  const tilesContainer = document.querySelector('div[data-testid="keno-tiles"]');
  if (!tilesContainer) {
    console.warn('[patterns] Keno tiles container not found');
    return;
  }

  const tiles = tilesContainer.querySelectorAll('button');

  // First, deselect all tiles
  tiles.forEach((tile) => {
    const tileNumber = parseInt(tile.textContent.trim().split('%')[0]);
    if (isNaN(tileNumber)) return;

    const isSelected =
      tile.getAttribute('aria-pressed') === 'true' ||
      tile.getAttribute('aria-checked') === 'true';

    if (isSelected) {
      // Click to deselect
      tile.click();
    }
  });

  // Wait a bit for deselection, then select the pattern numbers
  setTimeout(() => {
    tiles.forEach((tile) => {
      const tileNumber = parseInt(tile.textContent.trim().split('%')[0]);
      if (isNaN(tileNumber)) return;

      if (numbers.includes(tileNumber)) {
        const isSelected =
          tile.getAttribute('aria-pressed') === 'true' ||
          tile.getAttribute('aria-checked') === 'true';

        if (!isSelected) {
          tile.click();
        }
      }
    });
  }, 100);
}

// Expose function globally for overlay button
window.__keno_showPatternAnalysis = showPatternAnalysisModal;
