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

// Saved patterns storage
const storageApi = (typeof browser !== 'undefined') ? browser : chrome;

/**
 * Save a pattern to storage
 * @param {Array<number>} numbers - Pattern numbers
 * @param {string} name - Optional name for the pattern
 */
export function savePattern(numbers, name = '') {
  return storageApi.storage.local.get('savedPatterns').then(res => {
    const savedPatterns = res.savedPatterns || [];
    const patternName = name || `Pattern ${savedPatterns.length + 1}`;

    savedPatterns.push({
      id: Date.now(),
      numbers: numbers.sort((a, b) => a - b),
      name: patternName,
      createdAt: Date.now()
    });

    return storageApi.storage.local.set({ savedPatterns }).then(() => savedPatterns);
  });
}

/**
 * Get all saved patterns
 */
export function getSavedPatterns() {
  return storageApi.storage.local.get('savedPatterns').then(res => {
    return res.savedPatterns || [];
  });
}

/**
 * Delete a saved pattern
 * @param {number} id - Pattern ID
 */
export function deleteSavedPattern(id) {
  return storageApi.storage.local.get('savedPatterns').then(res => {
    let savedPatterns = res.savedPatterns || [];
    savedPatterns = savedPatterns.filter(p => p.id !== id);
    return storageApi.storage.local.set({ savedPatterns }).then(() => savedPatterns);
  });
}

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

  // Get saved patterns
  const savedPatterns = await getSavedPatterns();

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

  // Saved patterns section
  if (savedPatterns.length > 0) {
    html += `
        <div style="background: #0f212e; padding: 15px; border-radius: 8px; margin-bottom: 15px; border: 1px solid #2a3b4a;">
            <h3 style="color: #74b9ff; font-size: 14px; margin: 0 0 10px 0;">💾 Saved Patterns (${savedPatterns.length})</h3>
            <div style="display: flex; flex-direction: column; gap: 8px; max-height: 150px; overflow-y: auto;">
    `;

    savedPatterns.forEach(savedPattern => {
      html += `
                <div style="background: #1a2c38; padding: 8px 10px; border-radius: 4px; display: flex; justify-content: space-between; align-items: center;">
                    <div class="saved-pattern-select" data-numbers="${savedPattern.numbers.join(',')}" style="flex: 1; cursor: pointer;" title="Click to select these numbers">
                        <span style="color: #fff; font-size: 13px; font-weight: bold;">${savedPattern.numbers.join(', ')}</span>
                        <span style="color: #666; font-size: 10px; margin-left: 8px;">${savedPattern.name}</span>
                    </div>
                    <button class="delete-pattern-btn" data-id="${savedPattern.id}" style="padding: 4px 8px; background: #ff7675; color: #fff; border: none; border-radius: 4px; font-size: 10px; cursor: pointer; margin-left: 8px;">Delete</button>
                </div>
      `;
    });

    html += `
            </div>
        </div>
    `;
  }

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

  // Save pattern buttons
  const saveButtons = document.querySelectorAll('.save-pattern-btn');
  saveButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const numbers = btn.dataset.numbers.split(',').map(n => parseInt(n));
      const name = prompt('Enter a name for this pattern (optional):') || `Pattern ${savedPatterns.length + 1}`;

      savePattern(numbers, name).then(() => {
        btn.textContent = '✓ Saved';
        btn.style.background = '#00b894';
        setTimeout(() => {
          modal.remove();
          showPatternAnalysisModal(patternSize, sortBy, sampleSize);
        }, 500);
      });
    });
  });

  // Delete saved pattern buttons
  const deleteButtons = document.querySelectorAll('.delete-pattern-btn');
  deleteButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = parseInt(btn.dataset.id);
      if (confirm('Delete this saved pattern?')) {
        deleteSavedPattern(id).then(() => {
          modal.remove();
          showPatternAnalysisModal(patternSize, sortBy, sampleSize);
        });
      }
    });
  });

  // Saved pattern selection
  const savedPatternSelects = document.querySelectorAll('.saved-pattern-select');
  savedPatternSelects.forEach(el => {
    el.addEventListener('click', () => {
      const numbers = el.dataset.numbers.split(',').map(n => parseInt(n));
      selectPatternNumbers(numbers);
      // Visual feedback
      el.style.backgroundColor = '#2a3b4a';
      setTimeout(() => {
        el.style.backgroundColor = '#1a2c38';
      }, 300);
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

// Expose function globally for overlay button
window.__keno_showPatternAnalysis = showPatternAnalysisModal;
