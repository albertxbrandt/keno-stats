// src/comparison.js
import { state } from './state.js';
import { getTopPredictions, getColdPredictions } from './autoplay.js';
import { getMomentumPrediction } from './momentum.js';
import { getHits, getMisses } from './storage.js';

/**
 * Initialize comparison window
 */
export function initComparisonWindow() {
  createComparisonWindow();
  setupWindowDragging();

  // Expose toggle function globally
  window.__keno_toggleComparison = toggleComparisonWindow;
  window.__keno_trackRound = trackRoundComparison;
}

/**
 * Create the comparison window UI
 */
function createComparisonWindow() {
  const existing = document.getElementById('keno-comparison-window');
  if (existing) existing.remove();

  const window = document.createElement('div');
  window.id = 'keno-comparison-window';
  window.style.cssText = `
        display: none;
        position: fixed;
        top: 100px;
        right: 20px;
        width: 500px;
        max-height: 600px;
        background: linear-gradient(135deg, #0f212e 0%, #1a2c38 100%);
        border: 2px solid #2a3f4f;
        border-radius: 12px;
        box-shadow: 0 10px 40px rgba(0,0,0,0.5);
        z-index: 10002;
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
        overflow: hidden;
    `;

  window.innerHTML = `
        <div id="comparison-header" style="background: linear-gradient(90deg, #1a2c38 0%, #2a3f4f 100%); padding: 12px 16px; cursor: move; border-bottom: 2px solid #3a5f6f; display: flex; justify-content: space-between; align-items: center;">
            <div style="display: flex; align-items: center; gap: 8px;">
                <span style="font-size: 18px;">📊</span>
                <span style="color: #74b9ff; font-weight: 700; font-size: 14px;">Method Comparison</span>
            </div>
            <div style="display: flex; align-items: center; gap: 12px;">
                <div style="display: flex; align-items: center; gap: 6px;">
                    <span style="color: #aaa; font-size: 10px;">Lookback:</span>
                    <input type="number" id="comparison-lookback" min="10" max="500" value="${state.comparisonLookback}" 
                        style="width: 50px; background: #14202b; border: 1px solid #444; color: #fff; padding: 3px 6px; border-radius: 4px; text-align: center; font-size: 10px;">
                </div>
                <button id="comparison-close" style="background: none; border: none; color: #ff7675; cursor: pointer; font-size: 18px; line-height: 1; padding: 0;">✕</button>
            </div>
        </div>
        <div style="padding: 16px; max-height: 540px; overflow-y: auto;">
            <div id="comparison-stats-top" style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-bottom: 12px;">
                <!-- Top 3 ranked methods will be inserted here -->
            </div>
            <div id="comparison-stats-others" style="display: none; margin-bottom: 12px;">
                <!-- 4th and 5th place methods will be inserted here -->
            </div>
            <button id="comparison-show-more" style="display: none; width: 100%; background: #2a3f4f; color: #74b9ff; border: 1px solid #3a5f6f; padding: 6px; border-radius: 4px; cursor: pointer; font-size: 10px; margin-bottom: 12px;">
                Show More Methods ▼
            </button>
            <div id="comparison-chart" style="width: 100%; height: 300px; background: #14202b; border-radius: 8px; padding: 12px; position: relative;">
                <canvas id="comparison-canvas" style="width: 100%; height: 100%;"></canvas>
            </div>
            <div style="margin-top: 12px; padding: 10px; background: #14202b; border-radius: 6px;">
                <div style="color: #888; font-size: 10px; margin-bottom: 6px;">Recent Performance:</div>
                <div id="comparison-recent" style="font-size: 10px; color: #aaa; max-height: 100px; overflow-y: auto;">
                    No data yet. Play some rounds to see comparisons.
                </div>
            </div>
        </div>
    `;

  document.body.appendChild(window);

  // Setup close button
  const closeBtn = document.getElementById('comparison-close');
  closeBtn.addEventListener('click', () => toggleComparisonWindow(false));

  // Setup lookback input
  const lookbackInput = document.getElementById('comparison-lookback');
  lookbackInput.addEventListener('change', () => {
    const val = parseInt(lookbackInput.value, 10);
    if (!isNaN(val) && val >= 10) {
      state.comparisonLookback = val;
      // Trim data if needed
      if (state.comparisonData.length > val) {
        state.comparisonData = state.comparisonData.slice(-val);
      }
      updateComparisonUI();
    }
  });

  // Setup show more button
  const showMoreBtn = document.getElementById('comparison-show-more');
  if (showMoreBtn) {
    showMoreBtn.addEventListener('click', () => {
      const othersContainer = document.getElementById('comparison-stats-others');
      if (othersContainer) {
        const isHidden = othersContainer.style.display === 'none';
        othersContainer.style.display = isHidden ? 'grid' : 'none';
        showMoreBtn.textContent = isHidden ? 'Show Less ▲' : 'Show More Methods ▼';
      }
    });
  }

  updateStatsCards();
}

/**
 * Setup dragging functionality
 */
function setupWindowDragging() {
  const window = document.getElementById('keno-comparison-window');
  const header = document.getElementById('comparison-header');
  if (!window || !header) return;

  let isDragging = false;
  let offsetX = 0;
  let offsetY = 0;

  header.addEventListener('mousedown', (e) => {
    if (e.target.closest('input') || e.target.closest('button')) return;
    isDragging = true;
    offsetX = e.clientX - window.offsetLeft;
    offsetY = e.clientY - window.offsetTop;
    header.style.cursor = 'grabbing';
  });

  document.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    const x = e.clientX - offsetX;
    const y = e.clientY - offsetY;
    window.style.left = `${x}px`;
    window.style.top = `${y}px`;
    window.style.right = 'auto';
  });

  document.addEventListener('mouseup', () => {
    isDragging = false;
    header.style.cursor = 'move';
  });
}

/**
 * Toggle comparison window visibility
 */
export function toggleComparisonWindow(show) {
  const window = document.getElementById('keno-comparison-window');
  if (!window) return;

  const shouldShow = show !== undefined ? show : !state.isComparisonWindowOpen;
  state.isComparisonWindowOpen = shouldShow;
  window.style.display = shouldShow ? 'block' : 'none';

  if (shouldShow) {
    updateComparisonUI();
  }
}

/**
 * Track a round for comparison
 */
export function trackRoundComparison(roundData) {
  if (!state.isComparisonWindowOpen) return; // Only track if window is open

  const { drawn } = roundData;
  if (!drawn || drawn.length === 0) return;

  // Generate predictions for each method
  const count = state.generatorCount || 3;
  const frequencyPred = getTopPredictions(count);
  const coldPred = getColdPredictions(count);

  let momentumPred = [];
  try {
    const config = {
      detectionWindow: parseInt(document.getElementById('momentum-detection')?.value) || 5,
      baselineWindow: parseInt(document.getElementById('momentum-baseline')?.value) || 50,
      momentumThreshold: parseFloat(document.getElementById('momentum-threshold')?.value) || 1.5,
      topNPool: parseInt(document.getElementById('momentum-pool')?.value) || 15,
      refreshFrequency: parseInt(document.getElementById('momentum-refresh')?.value) || 5
    };
    momentumPred = getMomentumPrediction(count, config);
  } catch (e) {
    console.warn('[Comparison] Momentum prediction failed:', e);
  }

  // Calculate hits for each method
  const frequencyHits = frequencyPred.filter(n => drawn.includes(n)).length;
  const coldHits = coldPred.filter(n => drawn.includes(n)).length;
  const momentumHits = momentumPred.filter(n => drawn.includes(n)).length;

  // Store data point
  const dataPoint = {
    round: state.currentHistory.length,
    frequency: { predicted: frequencyPred, hits: frequencyHits, count },
    cold: { predicted: coldPred, hits: coldHits, count },
    momentum: { predicted: momentumPred, hits: momentumHits, count }
  };

  state.comparisonData.push(dataPoint);

  // Trim to lookback size
  if (state.comparisonData.length > state.comparisonLookback) {
    state.comparisonData.shift();
  }

  // Update UI
  updateComparisonUI();
}

/**
 * Update stats cards
 */
function updateStatsCards() {
  const topContainer = document.getElementById('comparison-stats-top');
  const othersContainer = document.getElementById('comparison-stats-others');
  const showMoreBtn = document.getElementById('comparison-show-more');
  if (!topContainer) return;

  const methods = [
    { name: 'Frequency', key: 'frequency', color: '#e17055', emoji: '🔥' },
    { name: 'Cold', key: 'cold', color: '#74b9ff', emoji: '❄️' },
    { name: 'Momentum', key: 'momentum', color: '#fdcb6e', emoji: '⚡' }
  ];

  // Calculate stats for each method
  const methodStats = methods.map(method => {
    const data = state.comparisonData.filter(d => d[method.key].predicted.length > 0);
    const totalHits = data.reduce((sum, d) => sum + d[method.key].hits, 0);
    const totalPredictions = data.reduce((sum, d) => sum + d[method.key].count, 0);
    const accuracy = totalPredictions > 0 ? ((totalHits / totalPredictions) * 100) : 0;
    const avgHits = data.length > 0 ? (totalHits / data.length) : 0;

    return {
      ...method,
      accuracy,
      avgHits,
      totalHits,
      totalPredictions,
      roundsTracked: data.length
    };
  });

  // Sort by accuracy (descending)
  methodStats.sort((a, b) => b.accuracy - a.accuracy);

  // Ranking badges
  const rankBadges = ['🥇', '🥈', '🥉', '4️⃣', '5️⃣'];
  const rankColors = ['#ffd700', '#c0c0c0', '#cd7f32', '#74b9ff', '#a29bfe'];

  // Generate card HTML
  const generateCard = (method, rank) => {
    return `
      <div style="background: linear-gradient(135deg, #14202b 0%, #1a2833 100%); padding: 12px; border-radius: 8px; border: 2px solid ${method.color}30; position: relative;">
        <div style="position: absolute; top: 8px; right: 8px; font-size: 20px;">${rankBadges[rank]}</div>
        <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 8px;">
          <span style="font-size: 16px;">${method.emoji}</span>
          <span style="color: ${method.color}; font-weight: 600; font-size: 11px;">${method.name}</span>
        </div>
        <div style="font-size: 24px; font-weight: 700; color: ${method.color}; margin-bottom: 4px;">${method.accuracy.toFixed(1)}%</div>
        <div style="font-size: 9px; color: #888;">Accuracy (${method.roundsTracked} rounds)</div>
        <div style="font-size: 10px; color: #aaa; margin-top: 6px;">Avg: ${method.avgHits.toFixed(2)} hits/round</div>
      </div>
    `;
  };

  // Top 3 methods
  const top3 = methodStats.slice(0, 3);
  topContainer.innerHTML = top3.map((method, index) => generateCard(method, index)).join('');

  // 4th and 5th place (if we have more methods in the future)
  if (methodStats.length > 3 && othersContainer) {
    const others = methodStats.slice(3, 5);
    othersContainer.style.display = 'none'; // Hidden by default
    othersContainer.style.gridTemplateColumns = 'repeat(2, 1fr)';
    othersContainer.style.gap = '10px';
    othersContainer.innerHTML = others.map((method, index) => generateCard(method, index + 3)).join('');

    if (showMoreBtn) {
      showMoreBtn.style.display = 'block';
    }
  } else {
    if (othersContainer) othersContainer.style.display = 'none';
    if (showMoreBtn) showMoreBtn.style.display = 'none';
  }
}

/**
 * Update comparison UI
 */
function updateComparisonUI() {
  updateStatsCards();
  drawComparisonChart();
  updateRecentPerformance();
}

/**
 * Draw comparison chart
 */
function drawComparisonChart() {
  const canvas = document.getElementById('comparison-canvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  // Set canvas size
  canvas.width = canvas.offsetWidth * 2;
  canvas.height = canvas.offsetHeight * 2;
  ctx.scale(2, 2);

  const width = canvas.offsetWidth;
  const height = canvas.offsetHeight;

  // Clear canvas
  ctx.clearRect(0, 0, width, height);

  if (state.comparisonData.length === 0) {
    ctx.fillStyle = '#666';
    ctx.font = '12px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('No data yet', width / 2, height / 2);
    return;
  }

  const methods = [
    { key: 'frequency', color: '#e17055', label: 'Frequency' },
    { key: 'cold', color: '#74b9ff', label: 'Cold' },
    { key: 'momentum', color: '#fdcb6e', label: 'Momentum' }
  ];

  const padding = { top: 20, right: 20, bottom: 30, left: 40 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  // Find max hits for Y axis
  const maxHits = Math.max(...state.comparisonData.flatMap(d =>
    [d.frequency.hits, d.cold.hits, d.momentum.hits]
  ));
  const yMax = Math.max(maxHits + 1, 5);

  // Draw grid
  ctx.strokeStyle = '#2a3f4f';
  ctx.lineWidth = 1;
  for (let i = 0; i <= 5; i++) {
    const y = padding.top + (chartHeight / 5) * i;
    ctx.beginPath();
    ctx.moveTo(padding.left, y);
    ctx.lineTo(padding.left + chartWidth, y);
    ctx.stroke();

    // Y axis labels
    const value = yMax - (yMax / 5) * i;
    ctx.fillStyle = '#666';
    ctx.font = '9px Inter, sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(value.toFixed(1), padding.left - 8, y + 3);
  }

  // Draw lines for each method
  methods.forEach(method => {
    ctx.strokeStyle = method.color;
    ctx.lineWidth = 2;
    ctx.beginPath();

    state.comparisonData.forEach((point, i) => {
      const x = padding.left + (chartWidth / (state.comparisonData.length - 1 || 1)) * i;
      const hits = point[method.key].hits;
      const y = padding.top + chartHeight - (hits / yMax) * chartHeight;

      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });

    ctx.stroke();

    // Draw points
    state.comparisonData.forEach((point, i) => {
      const x = padding.left + (chartWidth / (state.comparisonData.length - 1 || 1)) * i;
      const hits = point[method.key].hits;
      const y = padding.top + chartHeight - (hits / yMax) * chartHeight;

      ctx.fillStyle = method.color;
      ctx.beginPath();
      ctx.arc(x, y, 3, 0, Math.PI * 2);
      ctx.fill();
    });
  });

  // Draw legend
  let legendX = padding.left;
  methods.forEach(method => {
    ctx.fillStyle = method.color;
    ctx.fillRect(legendX, height - 15, 12, 3);
    ctx.fillStyle = '#aaa';
    ctx.font = '9px Inter, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(method.label, legendX + 16, height - 10);
    legendX += ctx.measureText(method.label).width + 30;
  });
}

/**
 * Update recent performance list
 */
function updateRecentPerformance() {
  const container = document.getElementById('comparison-recent');
  if (!container || state.comparisonData.length === 0) return;

  const recent = state.comparisonData.slice(-10).reverse();

  container.innerHTML = recent.map(point => {
    const freq = point.frequency;
    const cold = point.cold;
    const mom = point.momentum;

    return `
            <div style="display: flex; justify-content: space-between; padding: 4px 0; border-bottom: 1px solid #2a3f4f;">
                <span style="color: #666;">Round ${point.round}</span>
                <div style="display: flex; gap: 12px;">
                    <span style="color: #e17055;">🔥 ${freq.hits}/${freq.count}</span>
                    <span style="color: #74b9ff;">❄️ ${cold.hits}/${cold.count}</span>
                    <span style="color: #fdcb6e;">⚡ ${mom.hits}/${mom.count}</span>
                </div>
            </div>
        `;
  }).join('');
}
