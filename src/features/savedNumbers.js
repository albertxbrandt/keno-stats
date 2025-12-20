// src/savedNumbers.js - Manage saved number combinations
import { state } from '../core/state.js';
import { getDrawn } from '../core/storage.js';

const storageApi = (typeof browser !== 'undefined') ? browser : chrome;

// Load bet multipliers data
let betMultipliers = null;
fetch(chrome.runtime.getURL('config/bet-multis.json'))
  .then(res => res.json())
  .then(data => {
    betMultipliers = data;
  })
  .catch(err => console.error('[savedNumbers] Failed to load bet multipliers:', err));

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

    displayRecent.forEach((item, _index) => {
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
 * Generate hit frequency line graph HTML
 * @param {Array<number>} numbers - The numbers being analyzed
 * @param {number} lookbackBets - How many bets to look back (default 50)
 * @param {string} riskMode - Risk mode (high, medium, low, classic)
 * @returns {string} HTML for hit frequency graph
 */
function generatePayoutGraph(numbers, lookbackBets = 50, riskMode = 'high') {
  if (!betMultipliers) {
    return '<div style="color:#666; text-align:center; padding:10px;">Loading payout data...</div>';
  }

  const history = state.currentHistory || [];
  const recentHistory = history.slice(-lookbackBets);
  const numberCount = numbers.length;

  // Calculate hit counts for each bet in the lookback period
  const hitCounts = recentHistory.map(round => {
    const drawnNumbers = getDrawn(round);
    return numbers.filter(num => drawnNumbers.includes(num)).length;
  });

  // Get payout data for this risk mode and number count
  const modeData = betMultipliers[riskMode];
  const payouts = (modeData && modeData[numberCount]) ? modeData[numberCount] : {};

  // Convert hit counts to multipliers, then to profit/loss (multiplier - 1)
  const multipliers = hitCounts.map(hits => payouts[hits] || 0);
  const profitLoss = multipliers.map(mult => mult - 1); // -1 = lost bet, +X = profit

  // Calculate cumulative profit/loss
  let cumulative = 0;
  const cumulativePL = profitLoss.map(pl => {
    cumulative += pl;
    return cumulative;
  });

  // Calculate graph dimensions
  const graphWidth = 400;
  const graphHeight = 150;
  const padding = { top: 10, right: 10, bottom: 30, left: 50 };
  const innerWidth = graphWidth - padding.left - padding.right;
  const innerHeight = graphHeight - padding.top - padding.bottom;

  const maxValue = Math.max(...cumulativePL, 1);
  const minValue = Math.min(...cumulativePL, -1);
  const range = maxValue - minValue;
  const dataPoints = cumulativePL.length;

  // Calculate zero line position
  const zeroY = padding.top + innerHeight * (maxValue / range);

  // Generate SVG path for line
  let pathData = '';
  const points = cumulativePL.map((cumPL, i) => {
    const x = padding.left + (i / Math.max(dataPoints - 1, 1)) * innerWidth;
    const y = padding.top + innerHeight - ((cumPL - minValue) / range) * innerHeight;
    return { x, y, cumPL, pl: profitLoss[i], mult: multipliers[i], hits: hitCounts[i] };
  });

  if (points.length > 0) {
    pathData = `M ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      pathData += ` L ${points[i].x} ${points[i].y}`;
    }
  }

  // Generate point circles with color based on profit/loss
  let circlesHtml = points.map(p => {
    const color = p.pl > 0 ? '#00b894' : p.pl < 0 ? '#ff7675' : '#888';
    return `<circle cx="${p.x}" cy="${p.y}" r="3" fill="${color}" stroke="#fff" stroke-width="1">
      <title>${p.hits} hits = ${p.mult}x (${p.pl >= 0 ? '+' : ''}${p.pl.toFixed(2)}x profit)</title>
    </circle>`;
  }).join('');

  // Generate Y-axis labels
  const yAxisSteps = 5;
  let yAxisLabels = '';
  for (let i = 0; i <= yAxisSteps; i++) {
    const value = minValue + (range / yAxisSteps) * i;
    const y = padding.top + innerHeight - (i / yAxisSteps) * innerHeight;
    const color = value >= 0 ? '#00b894' : '#ff7675';
    yAxisLabels += `
      <text x="${padding.left - 5}" y="${y}" text-anchor="end" dominant-baseline="middle" fill="${color}" font-size="10">${value >= 0 ? '+' : ''}${value.toFixed(1)}x</text>
      <line x1="${padding.left}" y1="${y}" x2="${graphWidth - padding.right}" y2="${y}" stroke="#2a3b4a" stroke-width="0.5" opacity="0.3"/>
    `;
  }

  // Add zero line
  yAxisLabels += `
    <line x1="${padding.left}" y1="${zeroY}" x2="${graphWidth - padding.right}" y2="${zeroY}" stroke="#666" stroke-width="1" stroke-dasharray="4,4"/>
    <text x="${padding.left - 5}" y="${zeroY}" text-anchor="end" dominant-baseline="middle" fill="#888" font-size="10" font-weight="bold">0x</text>
  `;

  // Generate X-axis labels (show every 10 bets)
  let xAxisLabels = '';
  const xStep = Math.max(Math.floor(dataPoints / 5), 1);
  for (let i = 0; i < dataPoints; i += xStep) {
    const x = padding.left + (i / Math.max(dataPoints - 1, 1)) * innerWidth;
    const betNumber = history.length - lookbackBets + i + 1;
    xAxisLabels += `
      <text x="${x}" y="${graphHeight - 5}" text-anchor="middle" fill="#666" font-size="9">#${betNumber}</text>
    `;
  }

  // Calculate total profit/loss stats
  const totalPL = cumulative;
  const wins = profitLoss.filter(pl => pl > 0).length;
  const losses = profitLoss.filter(pl => pl < 0).length;
  const winRate = ((wins / profitLoss.length) * 100).toFixed(1);

  return `
    <div class="payout-graph-wrapper" style="background: #0f212e; padding: 15px; border-radius: 8px; margin-bottom: 15px;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
        <h3 style="color: #74b9ff; font-size: 14px; margin: 0;">� Cumulative Profit/Loss</h3>
        <select id="risk-mode-selector" style="background: #1a2c38; color: #fff; border: 1px solid #2a3b4a; border-radius: 4px; padding: 4px 8px; font-size: 11px; cursor: pointer;">
          <option value="high" ${riskMode === 'high' ? 'selected' : ''}>High Risk</option>
          <option value="medium" ${riskMode === 'medium' ? 'selected' : ''}>Medium Risk</option>
          <option value="low" ${riskMode === 'low' ? 'selected' : ''}>Low Risk</option>
          <option value="classic" ${riskMode === 'classic' ? 'selected' : ''}>Classic</option>
        </select>
      </div>
      
      <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; margin-bottom: 10px; padding: 8px; background: #1a2c38; border-radius: 4px;">
        <div style="text-align: center;">
          <div style="color: ${totalPL >= 0 ? '#00b894' : '#ff7675'}; font-size: 16px; font-weight: bold;">${totalPL >= 0 ? '+' : ''}${totalPL.toFixed(2)}x</div>
          <div style="color: #666; font-size: 9px;">Total P/L</div>
        </div>
        <div style="text-align: center;">
          <div style="color: #74b9ff; font-size: 16px; font-weight: bold;">${winRate}%</div>
          <div style="color: #666; font-size: 9px;">Win Rate</div>
        </div>
        <div style="text-align: center;">
          <div style="color: #888; font-size: 16px; font-weight: bold;">${wins}W/${losses}L</div>
          <div style="color: #666; font-size: 9px;">Record</div>
        </div>
      </div>
      
      <div style="margin-bottom: 10px;">
        <label style="color: #888; font-size: 11px; display: flex; align-items: center; gap: 8px;">
          <span style="min-width: 80px;">Lookback bets:</span>
          <input type="number" id="lookback-input" min="10" max="${Math.min(history.length, 200)}" value="${lookbackBets}" 
            style="background: #1a2c38; color: #fff; border: 1px solid #2a3b4a; border-radius: 4px; padding: 4px 8px; font-size: 11px; width: 70px;">
        </label>
      </div>

      <svg width="${graphWidth}" height="${graphHeight}" style="background: #0a1620; border-radius: 4px; display: block;">
        ${yAxisLabels}
        ${xAxisLabels}
        <path d="${pathData}" fill="none" stroke="${totalPL >= 0 ? '#00b894' : '#ff7675'}" stroke-width="2"/>
        ${circlesHtml}
      </svg>

      <div style="color: #666; font-size: 10px; margin-top: 8px; padding-top: 8px; border-top: 1px solid #1a2c38;">
        Shows cumulative profit/loss for ${numberCount} number${numberCount !== 1 ? 's' : ''} over last ${lookbackBets} bets. Green = profit, Red = loss
      </div>
    </div>
  `;
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

  // Load saved preferences
  storageApi.storage.local.get(['graphRiskMode', 'graphLookback'], (result) => {
    const savedRiskMode = result.graphRiskMode || 'high';
    const savedLookback = result.graphLookback || 50;

    buildModal(numbers, comboName, hits, savedRiskMode, savedLookback);
  });
}

function buildModal(numbers, comboName, hits, initialRiskMode, initialLookback) {

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

  // Generate payout graph HTML with saved preferences
  const payoutGraphHtml = generatePayoutGraph(numbers, initialLookback, initialRiskMode);

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

    ${payoutGraphHtml}
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

  // Risk mode selector and lookback input event listeners with dynamic update
  function attachGraphControls() {
    const riskSelector = document.getElementById('risk-mode-selector');
    const lookbackInput = document.getElementById('lookback-input');

    let currentRiskMode = initialRiskMode;
    let currentLookback = initialLookback;

    if (riskSelector) {
      currentRiskMode = getSelectValue(riskSelector, 'classic');
      riskSelector.addEventListener('change', (_e) => {
        currentRiskMode = getSelectValue(riskSelector, 'classic');
        // Save preference
        storageApi.storage.local.set({ graphRiskMode: currentRiskMode });
        updateGraph();
      });
    }

    if (lookbackInput) {
      currentLookback = getIntValue(lookbackInput, 50);
      lookbackInput.addEventListener('change', (e) => {
        const min = parseInt(e.target.min);
        const max = parseInt(e.target.max);
        let value = getIntValue(e.target, 50, { min, max });

        currentLookback = value;
        // Save preference
        storageApi.storage.local.set({ graphLookback: currentLookback });
        updateGraph();
      });
    }

    function updateGraph() {
      const newGraphHtml = generatePayoutGraph(numbers, currentLookback, currentRiskMode);

      // Replace just the payout graph section
      const graphContainer = content.querySelector('.payout-graph-wrapper');
      if (graphContainer) {
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = newGraphHtml;
        graphContainer.replaceWith(tempDiv.firstElementChild);

        // Re-attach event listeners to new controls
        attachGraphControls();
      }
    }
  }
  attachGraphControls();
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

  const tilesContainer = document.querySelector('div[data-testid="game-keno"]');
  if (!tilesContainer) {
    console.warn('[savedNumbers] Keno tiles container not found');
    return;
  }

  const tiles = tilesContainer.querySelectorAll('button');

  setTimeout(() => {
    tiles.forEach((tile) => {
      const tileNumber = getTileNumber(tile);
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
window.__keno_selectNumbers = selectNumbers;
window.__keno_analyzeCombination = analyzeCombinationHits;
