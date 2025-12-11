// src/savedNumbers.js - Manage saved number combinations
import { state } from './state.js';
import { getDrawn, getSelected } from './storage.js';

const storageApi = (typeof browser !== 'undefined') ? browser : chrome;

/**
 * Save a number combination
 * @param {Array<number>} numbers - Array of numbers (1-40)
 * @param {string} name - Optional name for the combination
 */
export function saveNumberCombination(numbers, name = '') {
  return storageApi.storage.local.get('savedNumbers').then(res => {
    const savedNumbers = res.savedNumbers || [];
    const comboName = name || `Combo ${savedNumbers.length + 1}`;

    savedNumbers.push({
      id: Date.now(),
      numbers: numbers.sort((a, b) => a - b),
      name: comboName,
      createdAt: Date.now()
    });

    return storageApi.storage.local.set({ savedNumbers }).then(() => {
      updateRecentPlayedUI();
      return savedNumbers;
    });
  });
}

/**
 * Get all saved number combinations
 */
export function getSavedNumbers() {
  return storageApi.storage.local.get('savedNumbers').then(res => {
    return res.savedNumbers || [];
  });
}

/**
 * Delete a saved number combination
 * @param {number} id - Combination ID
 */
export function deleteSavedNumber(id) {
  return storageApi.storage.local.get('savedNumbers').then(res => {
    let savedNumbers = res.savedNumbers || [];
    savedNumbers = savedNumbers.filter(c => c.id !== id);
    return storageApi.storage.local.set({ savedNumbers }).then(() => {
      updateRecentPlayedUI();
      return savedNumbers;
    });
  });
}

/**
 * Track recently played numbers
 * @param {Array<number>} numbers - Numbers that were just played
 */
export function trackPlayedNumbers(numbers) {
  return storageApi.storage.local.get('recentlyPlayed').then(res => {
    let recentlyPlayed = res.recentlyPlayed || [];

    const sortedNumbers = numbers.sort((a, b) => a - b);
    const numbersKey = sortedNumbers.join(',');

    // Remove this combination if it already exists (to move it to front)
    recentlyPlayed = recentlyPlayed.filter(play => {
      const playKey = play.numbers.sort((a, b) => a - b).join(',');
      return playKey !== numbersKey;
    });

    // Add to front of array with updated timestamp
    recentlyPlayed.unshift({
      numbers: sortedNumbers,
      playedAt: Date.now()
    });

    // Keep only last 10 unique combinations
    recentlyPlayed = recentlyPlayed.slice(0, 10);

    return storageApi.storage.local.set({ recentlyPlayed }).then(() => {
      updateRecentPlayedUI();
      return recentlyPlayed;
    });
  });
}

/**
 * Get recently played numbers
 */
export function getRecentlyPlayed() {
  return storageApi.storage.local.get('recentlyPlayed').then(res => {
    return res.recentlyPlayed || [];
  });
}

/**
 * Update the recent played numbers UI
 */
export function updateRecentPlayedUI() {
  Promise.all([getRecentlyPlayed(), getSavedNumbers()]).then(([recentlyPlayed, savedNumbers]) => {
    const container = document.getElementById('recent-played-list');
    if (!container) return;

    container.innerHTML = '';

    // Show only top 3
    const displayRecent = recentlyPlayed.slice(0, 3);

    if (displayRecent.length === 0) {
      container.innerHTML = '<div style="color:#666; font-size:10px; padding:8px; text-align:center;">No recent plays</div>';
      return;
    }

    displayRecent.forEach((item, index) => {
      const isSaved = savedNumbers.some(s =>
        s.numbers.length === item.numbers.length &&
        s.numbers.every((n, i) => n === item.numbers[i])
      );

      const savedCombo = isSaved ? savedNumbers.find(s =>
        s.numbers.length === item.numbers.length &&
        s.numbers.every((n, i) => n === item.numbers[i])
      ) : null;

      const div = document.createElement('div');
      div.style.cssText = 'background:#0f212e; padding:8px; border-radius:4px; margin-bottom:6px; border:1px solid #2a3b4a;';

      div.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
          <div style="flex:1; cursor:pointer;" class="recent-select" data-numbers="${item.numbers.join(',')}">
            <div style="color:#fff; font-size:11px; font-weight:bold;">${item.numbers.join(', ')}</div>
            ${savedCombo ? `<div style="color:#00b894; font-size:9px;">💾 ${savedCombo.name}</div>` : ''}
          </div>
          <div style="display:flex; gap:4px;">
            <button class="info-combo-btn" data-numbers="${item.numbers.join(',')}" data-name="${savedCombo ? savedCombo.name : 'Recent Play'}" 
              style="padding:4px 8px; background:#2a3b4a; color:#74b9ff; border:none; border-radius:4px; font-size:9px; cursor:pointer; white-space:nowrap;">
              ℹ️
            </button>
            <button class="${isSaved ? 'unsave' : 'save'}-combo-btn" data-numbers="${item.numbers.join(',')}" ${isSaved ? `data-id="${savedCombo.id}"` : ''} 
              style="padding:4px 8px; background:${isSaved ? '#ff7675' : '#00b894'}; color:#fff; border:none; border-radius:4px; font-size:9px; cursor:pointer; white-space:nowrap;">
              ${isSaved ? '✕' : '💾'}
            </button>
          </div>
        </div>
      `;

      container.appendChild(div);
    });

    // Add event listeners
    document.querySelectorAll('.recent-select').forEach(el => {
      el.addEventListener('click', () => {
        const numbers = el.dataset.numbers.split(',').map(n => parseInt(n));
        selectNumbers(numbers);
      });
    });

    document.querySelectorAll('.save-combo-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const numbers = btn.dataset.numbers.split(',').map(n => parseInt(n));
        const name = prompt('Enter a name for this combination (optional):') || `Combo ${Date.now()}`;
        saveNumberCombination(numbers, name);
      });
    });

    document.querySelectorAll('.unsave-combo-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = parseInt(btn.dataset.id);
        if (confirm('Remove this combination from saved?')) {
          deleteSavedNumber(id);
        }
      });
    });

    document.querySelectorAll('.info-combo-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const numbers = btn.dataset.numbers.split(',').map(n => parseInt(n));
        const name = btn.dataset.name;
        analyzeCombinationHits(numbers, name);
      });
    });
  });
}

/**
 * Analyze when a combination hit all numbers
 * @param {Array<number>} numbers - Numbers to analyze
 * @param {string} comboName - Name of the combination
 */
function analyzeCombinationHits(numbers, comboName) {
  const history = state.currentHistory || [];
  const hits = [];

  // Check each round in history
  history.forEach((round, index) => {
    const drawnNumbers = getDrawn(round);
    const allHit = numbers.every(num => drawnNumbers.includes(num));

    if (allHit) {
      hits.push({
        historyIndex: index, // Store index for dynamic calculation
        time: round.time,
        drawn: drawnNumbers
      });
    }
  });

  // Show modal with results
  showCombinationHitsModal(numbers, comboName, hits);
}

/**
 * Show modal displaying when a combination hit
 * @param {Array<number>} numbers - The numbers being analyzed
 * @param {string} comboName - Name of the combination
 * @param {Array} hits - Array of hit occurrences
 */
function showCombinationHitsModal(numbers, comboName, hits) {
  // Remove existing modal
  const existing = document.getElementById('combo-hits-modal');
  if (existing) existing.remove();

  const modal = document.createElement('div');
  modal.id = 'combo-hits-modal';
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
    zIndex: '1000001',
    fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif'
  });

  const content = document.createElement('div');
  Object.assign(content.style, {
    backgroundColor: '#1a2c38',
    padding: '25px',
    borderRadius: '12px',
    maxWidth: '500px',
    width: '90%',
    maxHeight: '70vh',
    overflow: 'auto',
    boxShadow: '0 10px 40px rgba(0,0,0,0.5)',
    color: '#fff'
  });

  const totalBets = state.currentHistory.length;
  const hitRate = totalBets > 0 ? ((hits.length / totalBets) * 100).toFixed(1) : '0.0';

  let html = `
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
      <h2 style="margin: 0; color: #74b9ff; font-size: 18px;">📊 Combination Stats</h2>
      <button id="close-hits-modal" style="background: none; border: none; color: #fff; font-size: 24px; cursor: pointer; padding: 0; width: 30px; height: 30px;">✕</button>
    </div>

    <div style="background: #0f212e; padding: 15px; border-radius: 8px; margin-bottom: 15px; border-left: 3px solid #00b894;">
      <div style="color: #fff; font-size: 15px; font-weight: bold; margin-bottom: 8px;">${numbers.join(', ')}</div>
      <div style="color: #888; font-size: 12px; margin-bottom: 12px;">${comboName}</div>
      <div style="display: flex; justify-content: space-between; padding-top: 10px; border-top: 1px solid #1a2c38;">
        <div>
          <div style="color: #00b894; font-size: 20px; font-weight: bold;">${hits.length}</div>
          <div style="color: #666; font-size: 10px;">Complete Hits</div>
        </div>
        <div style="text-align: right;">
          <div style="color: #74b9ff; font-size: 20px; font-weight: bold;">${hitRate}%</div>
          <div style="color: #666; font-size: 10px;">Hit Rate</div>
        </div>
      </div>
    </div>
  `;

  if (hits.length === 0) {
    html += '<div style="color:#666; text-align:center; padding:30px 20px; background:#0f212e; border-radius:8px;">This combination has never hit all numbers in your bet history.</div>';
  } else {
    html += `
      <div style="margin-bottom: 10px;">
        <h3 style="color: #74b9ff; font-size: 14px; margin: 0 0 10px 0;">All Occurrences (${hits.length})</h3>
      </div>
      <div style="display: flex; flex-direction: column; gap: 8px; max-height: 300px; overflow-y: auto;">
    `;

    // Sort hits by most recent first (highest index = most recent)
    hits.sort((a, b) => b.historyIndex - a.historyIndex).forEach(hit => {
      const betNumber = hit.historyIndex + 1; // Convert 0-based index to 1-based bet number
      const betsAgo = totalBets - betNumber; // How many bets ago this occurred
      const timeStr = new Date(hit.time).toLocaleString();

      html += `
        <div style="background: #0f212e; padding: 10px 12px; border-radius: 6px; border-left: 3px solid #00b894;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
            <span style="color: #00b894; font-weight: bold; font-size: 12px;">Bet #${betNumber}</span>
            <span style="color: #888; font-size: 10px;">${betsAgo} bet${betsAgo !== 1 ? 's' : ''} ago</span>
          </div>
          <div style="color: #666; font-size: 10px;">${timeStr}</div>
        </div>
      `;
    });

    html += '</div>';
  }

  html += `
    <div style="margin-top: 20px; padding-top: 15px; border-top: 1px solid #333;">
      <div style="color: #666; font-size: 11px; line-height: 1.5;">
        <strong style="color: #888;">Note:</strong> Shows all bets where every number in this combination appeared in the drawn numbers.
      </div>
    </div>
  `;

  content.innerHTML = html;
  modal.appendChild(content);
  document.body.appendChild(modal);

  // Event listeners
  document.getElementById('close-hits-modal')?.addEventListener('click', () => modal.remove());
  modal.addEventListener('click', (e) => {
    if (e.target === modal) modal.remove();
  });
}

/**
 * Show all saved numbers modal
 */
export function showSavedNumbersModal() {
  getSavedNumbers().then(savedNumbers => {
    // Remove existing modal
    const existing = document.getElementById('saved-numbers-modal');
    if (existing) existing.remove();

    const modal = document.createElement('div');
    modal.id = 'saved-numbers-modal';
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

    const content = document.createElement('div');
    Object.assign(content.style, {
      backgroundColor: '#1a2c38',
      padding: '25px',
      borderRadius: '12px',
      maxWidth: '500px',
      width: '90%',
      maxHeight: '70vh',
      overflow: 'auto',
      boxShadow: '0 10px 40px rgba(0,0,0,0.5)',
      color: '#fff'
    });

    let html = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
        <h2 style="margin: 0; color: #74b9ff; font-size: 20px;">💾 Saved Number Combinations</h2>
        <button id="close-saved-modal" style="background: none; border: none; color: #fff; font-size: 24px; cursor: pointer; padding: 0; width: 30px; height: 30px;">✕</button>
      </div>
    `;

    if (savedNumbers.length === 0) {
      html += '<div style="color:#666; text-align:center; padding:40px 20px;">No saved combinations yet.<br><br>Play some rounds and save your favorite number combinations!</div>';
    } else {
      html += '<div style="display: flex; flex-direction: column; gap: 10px;">';

      savedNumbers.forEach(combo => {
        const date = new Date(combo.createdAt).toLocaleDateString();
        html += `
          <div style="background: #0f212e; padding: 12px; border-radius: 6px; border-left: 3px solid #00b894;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
              <div class="saved-combo-select" data-numbers="${combo.numbers.join(',')}" style="flex: 1; cursor: pointer;">
                <div style="color: #fff; font-size: 14px; font-weight: bold; margin-bottom: 4px;">${combo.numbers.join(', ')}</div>
                <div style="color: #888; font-size: 11px;">${combo.name}</div>
              </div>
              <div style="display:flex; gap:6px;">
                <button class="info-saved-btn" data-numbers="${combo.numbers.join(',')}" data-name="${combo.name}" style="padding: 6px 10px; background: #2a3b4a; color: #74b9ff; border: none; border-radius: 4px; font-size: 11px; cursor: pointer;">ℹ️ Info</button>
                <button class="delete-saved-btn" data-id="${combo.id}" style="padding: 6px 10px; background: #ff7675; color: #fff; border: none; border-radius: 4px; font-size: 11px; cursor: pointer;">Delete</button>
              </div>
            </div>
            <div style="color: #666; font-size: 10px;">Saved: ${date}</div>
          </div>
        `;
      });

      html += '</div>';
    }

    content.innerHTML = html;
    modal.appendChild(content);
    document.body.appendChild(modal);

    // Event listeners
    document.getElementById('close-saved-modal')?.addEventListener('click', () => modal.remove());
    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.remove();
    });

    document.querySelectorAll('.saved-combo-select').forEach(el => {
      el.addEventListener('click', () => {
        const numbers = el.dataset.numbers.split(',').map(n => parseInt(n));
        selectNumbers(numbers);
        modal.remove();
      });
    });

    document.querySelectorAll('.delete-saved-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = parseInt(btn.dataset.id);
        if (confirm('Delete this saved combination?')) {
          deleteSavedNumber(id).then(() => {
            modal.remove();
            showSavedNumbersModal(); // Refresh modal
          });
        }
      });
    });

    document.querySelectorAll('.info-saved-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const numbers = btn.dataset.numbers.split(',').map(n => parseInt(n));
        const name = btn.dataset.name;
        analyzeCombinationHits(numbers, name);
      });
    });
  });
}

/**
 * Select numbers on the Keno board
 * @param {Array<number>} numbers - Numbers to select (1-40)
 */
function selectNumbers(numbers) {
  // First, clear the table using the clear button
  const clearButton = document.querySelector('button[data-testid="clear-table-button"]');
  if (clearButton) {
    clearButton.click();
  }

  const tilesContainer = document.querySelector('div[data-testid="keno-tiles"]');
  if (!tilesContainer) {
    console.warn('[savedNumbers] Keno tiles container not found');
    return;
  }

  const tiles = tilesContainer.querySelectorAll('button');

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

// Expose functions globally
window.__keno_showSavedNumbers = showSavedNumbersModal;
window.__keno_updateRecentPlayed = updateRecentPlayedUI;
