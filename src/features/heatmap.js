// src/heatmap.js
import { state } from '../state.js';
import { getHits, getMisses } from '../storage.js';

export function highlightRound(round) {
    const container = document.querySelector('div[data-testid="game-keno"]');
    if (!container) return;
    const tiles = container.querySelectorAll('button');
    tiles.forEach(tile => {
        const numText = tile.textContent.trim();
        const num = parseInt(numText.split('%')[0]);
        if (isNaN(num)) return;
        if (!state.isPredictMode) {
            tile.style.boxShadow = "";
            tile.style.transform = "";
        }
        const hits = getHits(round);
        const misses = getMisses(round);
        if (hits.includes(num)) {
            tile.style.boxShadow = "inset 0 0 0 4px #00b894";
            tile.style.transition = "box-shadow 0.1s";
            tile.style.transform = "scale(1.05)";
            tile.style.zIndex = "10";
        } else if (misses.includes(num)) {
            tile.style.boxShadow = "inset 0 0 0 4px #ff7675";
            tile.style.transition = "box-shadow 0.1s";
        } else {
            if (!state.isPredictMode) tile.style.opacity = "0.3";
        }
    });
}

export function highlightPrediction(numbers) {
    const container = document.querySelector('div[data-testid="game-keno"]');
    if (!container) return;
    const tiles = container.querySelectorAll('button');
    tiles.forEach(t => { t.style.boxShadow = ""; t.style.opacity = "1"; t.style.transform = ""; t.style.borderColor = ""; });
    tiles.forEach(tile => {
        const numText = tile.textContent.trim();
        const num = parseInt(numText.split('%')[0]);
        if (isNaN(num)) return;
        if (numbers.includes(num)) {
            tile.style.boxShadow = "inset 0 0 0 4px #74b9ff, 0 0 15px #74b9ff";
            tile.style.transform = "scale(1.1)";
            tile.style.zIndex = "20";
            tile.style.borderColor = "#74b9ff";
        } else {
            tile.style.opacity = "0.4";
        }
    });
}

export function clearHighlight() {
    if (state.isPredictMode) {
        // Let prediction repaint itself
        if (window.__keno_calculatePrediction) window.__keno_calculatePrediction();
        return;
    }
    const container = document.querySelector('div[data-testid="game-keno"]');
    if (!container) return;
    const tiles = container.querySelectorAll('button');
    tiles.forEach(tile => {
        tile.style.boxShadow = "";
        tile.style.transform = "";
        tile.style.zIndex = "";
        tile.style.opacity = "";
        tile.style.borderColor = "";
    });
}

export function updateHeatmap() {
    if (!window.location.href.includes("keno")) return;
    if (state.currentHistory.length === 0) return;
    // Only update heatmap if enabled and visible
    if (!state.isHeatmapActive) return;
    if (!state.panelVisibility || !state.panelVisibility.heatmap) return;
    const sampleCount = Math.min(state.heatmapSampleSize, state.currentHistory.length);
    let sample = state.currentHistory.slice(-sampleCount);
    if (sample.length === 0) return;
    const counts = {};
    const totalGames = sample.length;
    sample.forEach(round => {
        const hits = getHits(round);
        const misses = getMisses(round);
        const allDrawn = [...hits, ...misses];
        allDrawn.forEach(num => { counts[num] = (counts[num] || 0) + 1; });
    });
    const container = document.querySelector('div[data-testid="game-keno"]');
    if (!container) return;
    const tiles = container.querySelectorAll('button');
    tiles.forEach(tile => {
        const numText = tile.textContent.trim();
        const cleanNum = parseInt(numText.split('%')[0]);
        if (isNaN(cleanNum)) return;
        const count = counts[cleanNum] || 0;
        const percent = ((count / totalGames) * 100).toFixed(0);
        let statBox = tile.querySelector('.keno-stat-box');
        if (!statBox) {
            statBox = document.createElement('div');
            statBox.className = 'keno-stat-box';
            Object.assign(statBox.style, { position: 'absolute', bottom: '2px', right: '2px', fontSize: '12px', padding: '2px 4px', fontWeight: 'bold', color: 'rgba(255,255,255,0.7)', backgroundColor: 'rgba(0,0,0,0.7)', borderRadius: '4px', pointerEvents: 'none' });
            tile.style.position = 'relative';
            tile.appendChild(statBox);
        }
        statBox.innerText = `${percent}%`;
        const thresholdHot = state.isHotMode ? 40 : 30;
        const thresholdCold = state.isHotMode ? 0 : 10;
        if (parseInt(percent) >= thresholdHot) statBox.style.color = '#00b894'; else if (parseInt(percent) <= thresholdCold) statBox.style.color = '#ff7675'; else statBox.style.color = 'rgba(255,255,255,0.7)';
    });
}

// Expose to window for cross-module callbacks in storage UI
window.__keno_highlightRound = highlightRound;
window.__keno_clearHighlight = clearHighlight;
window.__keno_updateHeatmap = updateHeatmap;

// Note: updateHeatmap is called on-demand via storage.js saveRound() callback
// No longer running on interval to improve performance with large datasets

