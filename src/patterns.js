// src/patterns.js - Pattern analysis for finding common number combinations
import { state } from './state.js';
import { getDrawn } from './storage.js';

// Cache for pattern analysis results
const patternCache = {
  data: new Map(), // key: `${patternSize}-${historyLength}` -> { patterns, stats, timestamp }
  maxAge: 300000, // 5 minutes

  get(patternSize, historyLength) {
    const key = `${patternSize}-${historyLength}`;
    const cached = this.data.get(key);

    if (cached && (Date.now() - cached.timestamp) < this.maxAge) {
      console.log('[patterns] Using cached data for size', patternSize);
      return cached;
    }
    return null;
  },

  set(patternSize, historyLength, patterns, stats) {
    const key = `${patternSize}-${historyLength}`;
    this.data.set(key, {
      patterns,
      stats,
      timestamp: Date.now()
    });
  },

  clear() {
    this.data.clear();
  }
};

// Clear cache when history changes (expose globally)
window.__keno_clearPatternCache = () => patternCache.clear();

// Import savedNumbers module for saving pattern combinations
import { saveNumberCombination } from './savedNumbers.js';

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
 * @param {boolean} useCache - Whether to use cached results (default true)
 * @param {number} sampleSize - Number of recent rounds to analyze (0 = all history)
 * @returns {Array<Object>} Array of pattern objects with numbers, frequency, and occurrences
 */
export function findCommonPatterns(patternSize, topN = 10, useCache = true, sampleSize = 0) {
  if (!patternSize || patternSize < 3 || patternSize > 10) {
    console.warn('[patterns] Invalid pattern size:', patternSize);
    return [];
  }

  const historyLength = state.currentHistory.length;
  const effectiveSampleSize = sampleSize > 0 ? Math.min(sampleSize, historyLength) : historyLength;

  // Check cache first (cache key includes sample size)
  const cacheKey = `${patternSize}-${historyLength}-${effectiveSampleSize}`;
  if (useCache) {
    const cached = patternCache.data.get(cacheKey);
    if (cached && (Date.now() - cached.timestamp) < patternCache.maxAge) {
      console.log('[patterns] Using cached data for size', patternSize, 'sample', effectiveSampleSize);
      return cached.patterns.slice(0, topN);
    }
  }

  console.log('[patterns] Computing patterns for size', patternSize, 'sample', effectiveSampleSize);
  const patternCounts = {}; // Map of pattern key -> { numbers: [], count: number, occurrences: [] }

  // Get the sample of history to analyze
  const historyToAnalyze = effectiveSampleSize > 0
    ? state.currentHistory.slice(-effectiveSampleSize)
    : state.currentHistory;

  const startIndex = historyLength - historyToAnalyze.length;

  // Analyze history
  historyToAnalyze.forEach((round, idx) => {
    const roundIndex = startIndex + idx;
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

  // Sort by frequency
  const sortedPatterns = Object.values(patternCounts)
    .sort((a, b) => b.count - a.count);

  // Calculate hotness score for each pattern (lower = hotter/more clustered)
  sortedPatterns.forEach(pattern => {
    if (pattern.occurrences.length > 1) {
      // Calculate average gap between occurrences
      const gaps = [];
      for (let i = 1; i < pattern.occurrences.length; i++) {
        gaps.push(pattern.occurrences[i].roundIndex - pattern.occurrences[i - 1].roundIndex);
      }
      pattern.avgGap = gaps.reduce((sum, gap) => sum + gap, 0) / gaps.length;
      pattern.hotness = pattern.avgGap; // Lower is hotter
    } else {
      pattern.avgGap = historyLength;
      pattern.hotness = historyLength;
    }

    // Last occurrence round index for recency sorting
    pattern.lastOccurrenceIndex = pattern.occurrences[pattern.occurrences.length - 1].roundIndex;
  });

  // Cache the full result
  if (useCache) {
    const stats = {
      totalCombinations: sortedPatterns.length,
      avgAppearance: sortedPatterns.length > 0
        ? (sortedPatterns.reduce((sum, p) => sum + p.count, 0) / sortedPatterns.length).toFixed(1)
        : 0
    };
    const cacheKey = `${patternSize}-${historyLength}-${effectiveSampleSize}`;
    patternCache.data.set(cacheKey, {
      patterns: sortedPatterns,
      stats,
      timestamp: Date.now()
    });
  }

  return sortedPatterns.slice(0, topN);
}

/**
 * Calculate statistics for a specific pattern size
 * @param {number} patternSize - Size of pattern (3-10)
 * @param {number} sampleSize - Number of recent rounds to analyze (0 = all)
 * @returns {Object} Statistics about patterns of this size
 */
export function getPatternStats(patternSize, sampleSize = 0) {
  if (state.currentHistory.length === 0) return { totalCombinations: 0, avgAppearance: 0 };

  const historyLength = state.currentHistory.length;
  const effectiveSampleSize = sampleSize > 0 ? Math.min(sampleSize, historyLength) : historyLength;
  const cacheKey = `${patternSize}-${historyLength}-${effectiveSampleSize}`;

  // Check cache first
  const cached = patternCache.data.get(cacheKey);
  if (cached && cached.stats && (Date.now() - cached.timestamp) < patternCache.maxAge) {
    return cached.stats;
  }

  // Trigger computation which will cache the results
  const patterns = findCommonPatterns(patternSize, 1000, true, sampleSize);
  const totalCombinations = patterns.length;
  const avgAppearance = patterns.length > 0
    ? (patterns.reduce((sum, p) => sum + p.count, 0) / patterns.length).toFixed(1)
    : 0;

  return { totalCombinations, avgAppearance };
}

/**
 * Display pattern analysis results in a modal
 * @param {number} patternSize - The size of patterns to find (3-10)
 * @param {string} sortBy - Sort method: 'frequency', 'recent', 'hot'
 * @param {number} sampleSize - Number of recent rounds to analyze (0 = all)
 */
export function showPatternAnalysisModal(patternSize, sortBy = 'frequency', sampleSize = 0) {
  // Show loading modal first
  showLoadingModal();

  // Use setTimeout to allow the loading modal to render
  setTimeout(() => {
    try {
      let patterns = findCommonPatterns(patternSize, 100, true, sampleSize);

      // Apply sorting
      if (sortBy === 'recent') {
        patterns.sort((a, b) => b.lastOccurrenceIndex - a.lastOccurrenceIndex);
      } else if (sortBy === 'hot') {
        patterns.sort((a, b) => a.hotness - b.hotness);
      }
      // Default 'frequency' is already sorted by count

      patterns = patterns.slice(0, 15);
      const stats = getPatternStats(patternSize, sampleSize);

      // Remove loading modal
      const loadingModal = document.getElementById('keno-pattern-loading');
      if (loadingModal) loadingModal.remove();

      if (patterns.length === 0) {
        alert(`No pattern data available.\nPlay more rounds to analyze patterns of size ${patternSize}.`);
        return;
      }

      // Show results modal
      showResultsModal(patternSize, patterns, stats, sortBy, sampleSize);
    } catch (error) {
      console.error('[patterns] Error analyzing patterns:', error);
      const loadingModal = document.getElementById('keno-pattern-loading');
      if (loadingModal) loadingModal.remove();
      alert('Error analyzing patterns. Please try again.');
    }
  }, 100);
}

/**
 * Show loading modal
 */
function showLoadingModal() {
  const existingLoading = document.getElementById('keno-pattern-loading');
  if (existingLoading) existingLoading.remove();

  const loadingModal = document.createElement('div');
  loadingModal.id = 'keno-pattern-loading';
  Object.assign(loadingModal.style, {
    position: 'fixed',
    top: '0',
    left: '0',
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: '1000001',
    fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif'
  });

  loadingModal.innerHTML = `
    <div style="background: #1a2c38; padding: 40px; border-radius: 12px; text-align: center; box-shadow: 0 10px 40px rgba(0,0,0,0.5);">
      <div style="display: inline-block; width: 50px; height: 50px; border: 4px solid #333; border-top-color: #74b9ff; border-radius: 50%; animation: spin 1s linear infinite;"></div>
      <div style="margin-top: 20px; color: #74b9ff; font-size: 16px; font-weight: bold;">Analyzing Patterns...</div>
      <style>
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      </style>
    </div>
  `;

  document.body.appendChild(loadingModal);
}

/**
 * Show results modal with patterns
 * @param {number} patternSize - Pattern size
 * @param {Array} patterns - Pattern results
 * @param {Object} stats - Statistics
 * @param {string} sortBy - Current sort method
 * @param {number} sampleSize - Current sample size
 */
async function showResultsModal(patternSize, patterns, stats, sortBy = 'frequency', sampleSize = 0) {
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
  const totalHistory = state.currentHistory.length;
  const analyzedCount = sampleSize > 0 ? Math.min(sampleSize, totalHistory) : totalHistory;

  let html = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
            <h2 style="margin: 0; color: #74b9ff; font-size: 20px;">Pattern Analysis: ${patternSize} Numbers</h2>
            <button id="close-pattern-modal" style="background: none; border: none; color: #fff; font-size: 24px; cursor: pointer; padding: 0; width: 30px; height: 30px;">✕</button>
        </div>
  `;

  html += `
        <div style="display: grid; grid-template-columns: 2fr 1fr; gap: 10px; margin-bottom: 15px;">
            <div>
                <label style="color: #888; font-size: 11px; display: block; margin-bottom: 4px;">Sort By</label>
                <select id="pattern-sort-select" style="width: 100%; padding: 8px; background: #0f212e; color: #fff; border: 1px solid #333; border-radius: 6px; font-size: 13px; cursor: pointer;">
                    <option value="frequency" ${sortBy === 'frequency' ? 'selected' : ''}>Most Frequent</option>
                    <option value="recent" ${sortBy === 'recent' ? 'selected' : ''}>Recently Hit</option>
                    <option value="hot" ${sortBy === 'hot' ? 'selected' : ''}>Hot (Clustered)</option>
                </select>
            </div>
            <div>
                <label style="color: #888; font-size: 11px; display: block; margin-bottom: 4px;">Sample Size</label>
                <input id="pattern-sample-input" type="number" min="0" max="${totalHistory}" value="${sampleSize}" placeholder="All" style="width: 100%; padding: 8px; background: #0f212e; color: #fff; border: 1px solid #333; border-radius: 6px; font-size: 13px;" />
            </div>
        </div>
        
        <button id="pattern-refresh-btn" style="width: 100%; padding: 10px; background: #2a3b4a; color: #74b9ff; border: none; border-radius: 6px; font-size: 13px; font-weight: bold; cursor: pointer; margin-bottom: 15px; transition: background 0.2s;" onmouseover="this.style.background='#3a4b5a'" onmouseout="this.style.background='#2a3b4a'">Apply Filters</button>
        
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
            <div style="color: #666; font-size: 11px; margin-top: 10px;">Analyzed ${analyzedCount} of ${totalHistory} rounds</div>
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
    const betsAgo = state.currentHistory.length - lastBetNumber;

    html += `
            <div style="background: #0f212e; padding: 12px 15px; border-radius: 8px; border-left: 3px solid ${index < 3 ? '#00b894' : '#74b9ff'};">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                    <div id="${patternId}" data-numbers="${pattern.numbers.join(',')}" style="flex: 1; cursor: pointer;" title="Click to select these numbers">
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            <div style="flex: 1;">
                                <span style="color: #aaa; font-size: 11px; margin-right: 8px;">#${index + 1}</span>
                                <span style="color: #fff; font-weight: bold; font-size: 15px;">${pattern.numbers.join(', ')}</span>
                            </div>
                            <div style="text-align: right;">
                                <div style="color: #00b894; font-weight: bold; font-size: 16px;">${pattern.count}×</div>
                                <div style="color: #888; font-size: 11px;">${percentage}%</div>
                            </div>
                        </div>
                    </div>
                    <button class="save-pattern-btn" data-numbers="${pattern.numbers.join(',')}" style="margin-left: 10px; padding: 6px 12px; background: #2a3b4a; color: #74b9ff; border: none; border-radius: 4px; font-size: 11px; cursor: pointer; white-space: nowrap;" title="Save this pattern">💾 Save</button>
                </div>
                <div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid #1a2c38;">
                    <div style="display: flex; justify-content: space-between; align-items: center; cursor: pointer;" onclick="document.getElementById('${dropdownId}').style.display = document.getElementById('${dropdownId}').style.display === 'none' ? 'block' : 'none';">
                        <span style="color: #aaa; font-size: 11px;">Last seen: Bet #${lastBetNumber} (${betsAgo} bet${betsAgo !== 1 ? 's' : ''} ago)</span>
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

  // Refresh button listener
  const refreshBtn = document.getElementById('pattern-refresh-btn');
  if (refreshBtn) {
    refreshBtn.addEventListener('click', () => {
      const newSortBy = document.getElementById('pattern-sort-select').value;
      const newSampleInput = document.getElementById('pattern-sample-input');
      const newSample = parseInt(newSampleInput.value) || 0;
      modal.remove();
      showPatternAnalysisModal(patternSize, newSortBy, newSample);
    });
  }

  // Save pattern buttons - integrate with savedNumbers
  const saveButtons = document.querySelectorAll('.save-pattern-btn');
  saveButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const numbers = btn.dataset.numbers.split(',').map(n => parseInt(n));
      const name = prompt('Enter a name for this combination (optional):') || '';

      saveNumberCombination(numbers, name).then(() => {
        btn.textContent = '✓ Saved';
        btn.style.background = '#00b894';
        setTimeout(() => {
          btn.textContent = '💾 Save';
          btn.style.background = '#2a3b4a';
        }, 1500);
      });
    });
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
  // First, clear the table using the clear button
  const clearButton = document.querySelector('button[data-testid="clear-table-button"]');
  if (clearButton) {
    clearButton.click();
  } else {
    console.warn('[patterns] Clear table button not found');
  }

  const tilesContainer = document.querySelector('div[data-testid="keno-tiles"]');
  if (!tilesContainer) {
    console.warn('[patterns] Keno tiles container not found');
    return;
  }

  const tiles = tilesContainer.querySelectorAll('button');

  // Wait a bit for clearing, then select the pattern numbers
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
  }, 150);
}

/**
 * Show live pattern analysis overlay
 */
export function showLivePatternAnalysis() {
  // Remove existing overlay
  const existing = document.getElementById('live-pattern-overlay');
  if (existing) {
    existing.remove();
    return; // Toggle off
  }

  const overlay = document.createElement('div');
  overlay.id = 'live-pattern-overlay';
  Object.assign(overlay.style, {
    position: 'fixed',
    top: '50%',
    right: '20px',
    transform: 'translateY(-50%)',
    width: '350px',
    maxHeight: '80vh',
    backgroundColor: '#1a2c38',
    borderRadius: '12px',
    boxShadow: '0 10px 40px rgba(0,0,0,0.5)',
    zIndex: '999999',
    fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column'
  });

  overlay.innerHTML = `
    <div id="live-pattern-header" style="padding: 15px; background: #0f212e; border-bottom: 2px solid #2a3b4a; display: flex; justify-content: space-between; align-items: center; cursor: move;">
      <h3 style="margin: 0; color: #74b9ff; font-size: 16px; pointer-events: none;">🔴 Live Pattern Analysis</h3>
      <button id="close-live-pattern" style="background: none; border: none; color: #fff; font-size: 20px; cursor: pointer; padding: 0; width: 24px; height: 24px;">✕</button>
    </div>
    
    <div style="padding: 15px; background: #0f212e; border-bottom: 1px solid #2a3b4a;">
      <div style="display: flex; gap: 10px; margin-bottom: 10px;">
        <div style="flex: 1;">
          <label style="color: #888; font-size: 11px; display: block; margin-bottom: 4px;">Pattern Size</label>
          <input type="number" id="live-pattern-size" min="2" max="10" value="5" 
            style="width: 100%; background: #1a2c38; color: #fff; border: 1px solid #2a3b4a; border-radius: 4px; padding: 6px 8px; font-size: 12px;">
        </div>
      </div>
      <div style="display: flex; gap: 10px; margin-bottom: 10px;">
        <div style="flex: 1;">
          <label style="color: #888; font-size: 11px; display: block; margin-bottom: 4px;">Min Hits</label>
          <input type="number" id="live-min-hits" min="1" max="10" value="5" 
            style="width: 100%; background: #1a2c38; color: #fff; border: 1px solid #2a3b4a; border-radius: 4px; padding: 6px 8px; font-size: 12px;">
        </div>
        <div style="flex: 1;">
          <label style="color: #888; font-size: 11px; display: block; margin-bottom: 4px;">Max Hits</label>
          <input type="number" id="live-max-hits" min="1" max="10" value="5" 
            style="width: 100%; background: #1a2c38; color: #fff; border: 1px solid #2a3b4a; border-radius: 4px; padding: 6px 8px; font-size: 12px;">
        </div>
      </div>
      <div style="margin-bottom: 10px;">
        <label style="color: #888; font-size: 11px; display: block; margin-bottom: 4px;">Sample Size</label>
        <input type="number" id="live-sample-size" min="1" max="1000" value="100" 
          style="width: 100%; background: #1a2c38; color: #fff; border: 1px solid #2a3b4a; border-radius: 4px; padding: 6px 8px; font-size: 12px;">
      </div>
      <div style="margin-bottom: 10px;">
        <label style="color: #888; font-size: 11px; display: block; margin-bottom: 4px;">Not Hit In (0 = off)</label>
        <input type="number" id="live-not-hit-in" min="0" max="1000" value="0" 
          style="width: 100%; background: #1a2c38; color: #fff; border: 1px solid #2a3b4a; border-radius: 4px; padding: 6px 8px; font-size: 12px;">
      </div>
      <button id="live-pattern-start" style="width: 100%; background: #00b894; color: #fff; border: none; padding: 8px; border-radius: 4px; font-weight: bold; cursor: pointer; font-size: 12px;">
        ▶ Start Live Analysis
      </button>
    </div>
    
    <div id="live-pattern-status" style="padding: 10px 15px; background: #0a1620; border-bottom: 1px solid #2a3b4a; color: #888; font-size: 11px; display: none;">
      <span id="status-text">Waiting to start...</span>
    </div>
    
    <div id="live-pattern-results" style="flex: 1; overflow-y: auto; padding: 15px; background: #213743;">
      <div style="color: #666; text-align: center; padding: 40px 20px; font-size: 12px;">
        Configure settings above and start analysis
      </div>
    </div>
  `;

  document.body.appendChild(overlay);

  // Make overlay draggable
  const header = document.getElementById('live-pattern-header');
  let isDragging = false;
  let currentX;
  let currentY;
  let initialX;
  let initialY;
  let xOffset = 0;
  let yOffset = 0;

  header.addEventListener('mousedown', dragStart);
  document.addEventListener('mousemove', drag);
  document.addEventListener('mouseup', dragEnd);

  function dragStart(e) {
    if (e.target.id === 'close-live-pattern') return;
    initialX = e.clientX - xOffset;
    initialY = e.clientY - yOffset;
    isDragging = true;
  }

  function drag(e) {
    if (isDragging) {
      e.preventDefault();
      currentX = e.clientX - initialX;
      currentY = e.clientY - initialY;
      xOffset = currentX;
      yOffset = currentY;
      setTranslate(currentX, currentY, overlay);
    }
  }

  function dragEnd(e) {
    isDragging = false;
  }

  function setTranslate(xPos, yPos, el) {
    el.style.transform = `translate(${xPos}px, ${yPos}px)`;
    el.style.top = '50%';
    el.style.right = 'auto';
    el.style.left = '50%';
  }

  // State for live analysis
  let isRunning = false;
  let updateInterval = null;
  let patternSize = 5;
  let sampleSize = 100;
  let minHits = 5;
  let maxHits = 5;
  let notHitIn = 0;
  let lastHistoryLength = 0;
  let cachedResults = null;

  const startBtn = document.getElementById('live-pattern-start');
  const statusDiv = document.getElementById('live-pattern-status');
  const statusText = document.getElementById('status-text');
  const resultsDiv = document.getElementById('live-pattern-results');
  const sizeInput = document.getElementById('live-pattern-size');
  const sampleInput = document.getElementById('live-sample-size');
  const minHitsInput = document.getElementById('live-min-hits');
  const maxHitsInput = document.getElementById('live-max-hits');
  const notHitInInput = document.getElementById('live-not-hit-in');

  // Auto-update minHits and maxHits when pattern size changes
  sizeInput.addEventListener('input', () => {
    const size = parseInt(sizeInput.value);
    if (!isNaN(size)) {
      minHitsInput.max = size;
      maxHitsInput.max = size;
      if (parseInt(minHitsInput.value) > size) {
        minHitsInput.value = size;
      }
      if (parseInt(maxHitsInput.value) > size) {
        maxHitsInput.value = size;
      }
    }
  });

  // Close button
  document.getElementById('close-live-pattern').addEventListener('click', () => {
    if (updateInterval) clearInterval(updateInterval);
    overlay.remove();
  });

  // Start/Stop button
  startBtn.addEventListener('click', () => {
    if (isRunning) {
      // Stop
      isRunning = false;
      clearInterval(updateInterval);
      startBtn.textContent = '▶ Start Live Analysis';
      startBtn.style.background = '#00b894';
      statusDiv.style.display = 'none';
      sizeInput.disabled = false;
      sampleInput.disabled = false;
      minHitsInput.disabled = false;
      maxHitsInput.disabled = false;
      notHitInInput.disabled = false;
    } else {
      // Start
      patternSize = parseInt(sizeInput.value);
      sampleSize = parseInt(sampleInput.value);
      minHits = parseInt(minHitsInput.value);
      maxHits = parseInt(maxHitsInput.value);
      notHitIn = parseInt(notHitInInput.value);

      if (patternSize < 2 || patternSize > 10) {
        alert('Pattern size must be between 2 and 10');
        return;
      }
      if (sampleSize < 1 || sampleSize > 1000) {
        alert('Sample size must be between 1 and 1000');
        return;
      }
      if (minHits < 1 || minHits > patternSize) {
        alert(`Min hits must be between 1 and ${patternSize}`);
        return;
      }
      if (maxHits < 1 || maxHits > patternSize) {
        alert(`Max hits must be between 1 and ${patternSize}`);
        return;
      }
      if (minHits > maxHits) {
        alert('Min hits cannot be greater than max hits');
        return;
      }
      if (notHitIn < 0 || notHitIn > 1000) {
        alert('Not hit in must be between 0 and 1000');
        return;
      }

      isRunning = true;
      startBtn.textContent = '⏸ Stop Analysis';
      startBtn.style.background = '#ff7675';
      statusDiv.style.display = 'block';
      sizeInput.disabled = true;
      sampleInput.disabled = true;
      minHitsInput.disabled = true;
      maxHitsInput.disabled = true;
      notHitInInput.disabled = true;

      // Reset cache
      lastHistoryLength = 0;
      cachedResults = null;

      // Initial update
      updateLivePatterns();

      // Update every 3 seconds (increased from 2 for better performance)
      updateInterval = setInterval(updateLivePatterns, 3000);
    }
  });

  function updateLivePatterns() {
    const startTime = performance.now();
    const history = state.currentHistory || [];
    const actualSampleSize = Math.min(sampleSize, history.length);

    if (history.length === 0) {
      resultsDiv.innerHTML = '<div style="color: #666; text-align: center; padding: 40px 20px; font-size: 12px;">No data available</div>';
      return;
    }

    // Skip update if history hasn't changed
    if (history.length === lastHistoryLength && cachedResults !== null) {
      const rangeText = minHits === maxHits ? `${minHits}` : `${minHits}-${maxHits}`;
      statusText.textContent = `Up to date - Pattern size: ${patternSize}, Hits: ${rangeText} (cached)`;
      return; // No new data, skip expensive computation
    }

    const rangeText = minHits === maxHits ? `${minHits}` : `${minHits}-${maxHits}`;
    statusText.textContent = `Analyzing ${actualSampleSize} rounds... Pattern size: ${patternSize}, Hits: ${rangeText}`;

    // Get sample of recent rounds
    const sample = history.slice(-actualSampleSize);

    lastHistoryLength = history.length;

    // Find all unique patterns and count partial hits
    const patternCountsMap = new Map();

    // Generate top 100 patterns only for performance (was 1000)
    const allPatterns = findCommonPatterns(patternSize, 100, false, actualSampleSize) || [];

    if (allPatterns.length === 0) {
      resultsDiv.innerHTML = '<div style="color: #666; text-align: center; padding: 40px 20px; font-size: 12px;">No patterns found</div>';
      return;
    }

    // Pre-cache drawn numbers for all rounds (avoid repeated getDrawn() calls)
    const historyForTracking = history.slice(-500);
    const trackingDrawnCache = historyForTracking.map(round => {
      const drawn = getDrawn(round);
      return new Set(drawn); // Use Set for O(1) lookups
    });

    const sampleDrawnCache = sample.map(round => {
      const drawn = getDrawn(round);
      return new Set(drawn);
    });

    // For each pattern, count how many rounds have at least minHits matches
    allPatterns.forEach(patternObj => {
      const pattern = patternObj.numbers;
      let hitCount = 0;
      let lastFullHit = -1; // Track when pattern last fully matched in ENTIRE history

      // Check last 500 bets for last full hit using cached Sets
      trackingDrawnCache.forEach((drawnSet, index) => {
        const matches = pattern.filter(num => drawnSet.has(num)).length;

        // Track full hits for "last hit" display - use last 500
        if (matches === patternSize) {
          lastFullHit = index;
        }
      });

      // Count hits within range in sample only using cached Sets
      sampleDrawnCache.forEach(drawnSet => {
        const matches = pattern.filter(num => drawnSet.has(num)).length;

        // Count hits within range
        if (matches >= minHits && matches <= maxHits) {
          hitCount++;
        }
      });

      if (hitCount > 0) {
        patternCountsMap.set(pattern.join(','), {
          numbers: pattern,
          count: hitCount,
          lastFullHit: lastFullHit
        });
      }
    });

    // Convert to array and sort by frequency
    let patterns = Array.from(patternCountsMap.values())
      .sort((a, b) => b.count - a.count);

    // Cache the results
    cachedResults = { patterns, totalGames: actualSampleSize, trackingSize: Math.min(history.length, 500) };

    // Filter by notHitIn if enabled (notHitIn > 0)
    if (notHitIn > 0) {
      const trackingSize = Math.min(history.length, 500);
      patterns = patterns.filter(pattern => {
        const betsAgo = pattern.lastFullHit === -1 ? Infinity : trackingSize - pattern.lastFullHit;
        return betsAgo >= notHitIn;
      });
    }

    if (patterns.length === 0) {
      resultsDiv.innerHTML = '<div style="color: #666; text-align: center; padding: 40px 20px; font-size: 12px;">No patterns found with current filters</div>';
      return;
    }

    // Calculate stats
    const totalGames = actualSampleSize;
    const uniquePatterns = patterns.length;
    const avgAppearance = patterns.reduce((sum, p) => sum + p.count, 0) / uniquePatterns;

    const computeTime = (performance.now() - startTime).toFixed(0);

    // Render results
    let html = `
      <div style="background: #0f212e; padding: 12px; border-radius: 8px; margin-bottom: 12px;">
        <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
          <div>
            <div style="color: #00b894; font-size: 18px; font-weight: bold;">${uniquePatterns}</div>
            <div style="color: #666; font-size: 10px;">Patterns</div>
          </div>
          <div style="text-align: right;">
            <div style="color: #74b9ff; font-size: 18px; font-weight: bold;">${avgAppearance.toFixed(1)}</div>
            <div style="color: #666; font-size: 10px;">Avg Rate</div>
          </div>
        </div>
        <div style="color: #888; font-size: 10px; padding-top: 8px; border-top: 1px solid #1a2c38; display: flex; justify-content: space-between;">
          <span>Last updated: ${new Date().toLocaleTimeString()}</span>
          <span style="color: ${computeTime < 100 ? '#00b894' : computeTime < 300 ? '#ffd700' : '#ff7675'};">${computeTime}ms</span>
        </div>
      </div>
      
      <div style="color: #888; font-size: 11px; margin-bottom: 8px; font-weight: bold;">Top Patterns:</div>
    `;

    patterns.slice(0, 10).forEach((pattern, index) => {
      const percentage = ((pattern.count / totalGames) * 100).toFixed(1);
      const isHot = percentage >= 15;

      const hitText = minHits === maxHits && minHits === patternSize
        ? `Full match (${patternSize}/${patternSize})`
        : minHits === maxHits
          ? `Exactly ${minHits} hits out of ${patternSize}`
          : `${minHits}-${maxHits} hits out of ${patternSize}`;

      // Calculate bets ago for last full hit - use last 500 bets
      const trackingSize = Math.min(history.length, 500);
      const betsAgo = pattern.lastFullHit === -1
        ? 'Never (last 500)'
        : pattern.lastFullHit === trackingSize - 1
          ? 'Just now'
          : `${trackingSize - pattern.lastFullHit} bet${trackingSize - pattern.lastFullHit > 1 ? 's' : ''} ago`;

      html += `
        <div class="live-pattern-card" data-numbers="${pattern.numbers.join(',')}" style="background: #0f212e; padding: 10px; border-radius: 6px; margin-bottom: 6px; border-left: 3px solid ${isHot ? '#00b894' : '#74b9ff'}; transition: all 0.2s; position: relative;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
            <span style="color: ${isHot ? '#00b894' : '#74b9ff'}; font-weight: bold; font-size: 11px;">#${index + 1}</span>
            <div style="display: flex; gap: 6px; align-items: center;">
              <button class="live-pattern-info-btn" data-numbers="${pattern.numbers.join(',')}" style="background: #2a3b4a; color: #74b9ff; border: none; padding: 3px 8px; border-radius: 3px; font-size: 9px; cursor: pointer; font-weight: bold; transition: background 0.2s;" onmouseover="this.style.background='#3a4b5a'" onmouseout="this.style.background='#2a3b4a'">ℹ️ Info</button>
              <span style="color: ${isHot ? '#00b894' : '#74b9ff'}; font-weight: bold; font-size: 12px;">${percentage}%</span>
            </div>
          </div>
          <div class="live-pattern-select" style="color: #fff; font-size: 12px; font-weight: bold; margin-bottom: 4px; cursor: pointer;">
            ${pattern.numbers.join(', ')}
          </div>
          <div style="color: #666; font-size: 10px; margin-bottom: 2px; pointer-events: none;">
            ${hitText} - Appeared ${pattern.count}/${totalGames} rounds
          </div>
          <div style="color: #888; font-size: 9px; pointer-events: none;">
            Last full hit: ${betsAgo}
          </div>
        </div>
      `;
    });

    resultsDiv.innerHTML = html;

    // Add click handlers to pattern cards
    document.querySelectorAll('.live-pattern-card').forEach(card => {
      card.addEventListener('mouseenter', () => {
        card.style.background = '#1a2c38';
      });
      card.addEventListener('mouseleave', () => {
        card.style.background = '#0f212e';
      });
    });
    
    // Add click handlers to select numbers
    document.querySelectorAll('.live-pattern-select').forEach(el => {
      el.addEventListener('click', () => {
        const numbers = el.textContent.split(', ').map(n => parseInt(n.trim()));
        if (window.__keno_selectNumbers) {
          window.__keno_selectNumbers(numbers);
        }
      });
    });

    // Add click handlers to info buttons
    document.querySelectorAll('.live-pattern-info-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation(); // Prevent card click
        const numbers = btn.dataset.numbers.split(',').map(n => parseInt(n));
        const comboName = `Live Pattern: ${numbers.join(', ')}`;
        
        // Call the same analysis function used by saved numbers
        if (window.__keno_analyzeCombination) {
          window.__keno_analyzeCombination(numbers, comboName);
        }
      });
    });
  }
}

// Expose function globally for overlay button
window.__keno_showPatternAnalysis = showPatternAnalysisModal;
window.__keno_showLivePatternAnalysis = showLivePatternAnalysis;
