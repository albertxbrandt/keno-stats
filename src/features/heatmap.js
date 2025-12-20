// src/heatmap.js
import { state } from '../core/state.js';
import { getHits, getMisses } from '../core/storage.js';

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

    let counts = {};
    const totalGames = sample.length;

    if (state.heatmapMode === 'trending') {
        // Trending mode: Calculate momentum scores
        const recentWindow = Math.floor(sampleCount / 4) || 5; // Recent 25% or minimum 5
        const baselineWindow = sampleCount - recentWindow;

        if (baselineWindow < 5) {
            // Not enough data for trending, fall back to hot
            sample.forEach(round => {
                const hits = getHits(round);
                const misses = getMisses(round);
                const allDrawn = [...hits, ...misses];
                allDrawn.forEach(num => { counts[num] = (counts[num] || 0) + 1; });
            });
        } else {
            const recentSample = sample.slice(-recentWindow);
            const baselineSample = sample.slice(0, baselineWindow);

            // Count frequencies in both windows
            const recentCounts = {};
            const baselineCounts = {};

            recentSample.forEach(round => {
                const hits = getHits(round);
                const misses = getMisses(round);
                const allDrawn = [...hits, ...misses];
                allDrawn.forEach(num => { recentCounts[num] = (recentCounts[num] || 0) + 1; });
            });

            baselineSample.forEach(round => {
                const hits = getHits(round);
                const misses = getMisses(round);
                const allDrawn = [...hits, ...misses];
                allDrawn.forEach(num => { baselineCounts[num] = (baselineCounts[num] || 0) + 1; });
            });

            // Calculate momentum ratios (recent frequency / baseline frequency)
            for (let num = 1; num <= 40; num++) {
                const recentRate = (recentCounts[num] || 0) / recentWindow;
                const baselineRate = (baselineCounts[num] || 0.01) / baselineWindow; // Avoid division by zero
                const momentum = recentRate / baselineRate;
                // Store raw momentum ratio (1.0 = neutral, >1 = trending up, <1 = trending down)
                counts[num] = momentum;
            }
        }
    } else {
        // Hot mode: Simple frequency count
        sample.forEach(round => {
            const hits = getHits(round);
            const misses = getMisses(round);
            const allDrawn = [...hits, ...misses];
            allDrawn.forEach(num => { counts[num] = (counts[num] || 0) + 1; });
        });
    }
    const container = document.querySelector('div[data-testid="game-keno"]');
    if (!container) return;
    const tiles = container.querySelectorAll('button');
    tiles.forEach(tile => {
        const numText = tile.textContent.trim();
        const cleanNum = parseInt(numText.split('%')[0].split('x')[0]); // Handle both % and x suffix
        if (isNaN(cleanNum)) return;
        const count = counts[cleanNum] || 0;
        let displayText;
        let percent; // Declare percent outside the if/else

        if (state.heatmapMode === 'trending') {
            // Trending mode shows momentum multiplier (e.g., "1.5x" = 50% more frequent)
            displayText = `${count.toFixed(1)}x`;
        } else {
            // Hot mode shows frequency percentage
            percent = ((count / totalGames) * 100).toFixed(0);
            displayText = `${percent}%`;
        }

        let statBox = tile.querySelector('.keno-stat-box');
        if (!statBox) {
            statBox = document.createElement('div');
            statBox.className = 'keno-stat-box';
            Object.assign(statBox.style, { position: 'absolute', bottom: '2px', right: '2px', fontSize: '12px', padding: '2px 4px', fontWeight: 'bold', color: 'rgba(255,255,255,0.7)', backgroundColor: 'rgba(0,0,0,0.7)', borderRadius: '4px', pointerEvents: 'none' });
            tile.style.position = 'relative';
            tile.appendChild(statBox);
        }
        statBox.innerText = displayText;

        // Different thresholds for different modes
        if (state.heatmapMode === 'trending') {
            // Trending: green for momentum > 1.2 (20%+ increase), red for < 0.8 (20%+ decrease)
            if (count >= 1.2) statBox.style.color = '#00b894';
            else if (count <= 0.8) statBox.style.color = '#ff7675';
            else statBox.style.color = 'rgba(255,255,255,0.7)';
        } else {
            // Hot mode: green for high frequency, red for low
            const thresholdHot = state.isHotMode ? 40 : 30;
            const thresholdCold = state.isHotMode ? 0 : 10;
            if (parseInt(percent) >= thresholdHot) statBox.style.color = '#00b894';
            else if (parseInt(percent) <= thresholdCold) statBox.style.color = '#ff7675';
            else statBox.style.color = 'rgba(255,255,255,0.7)';
        }
    });
}

// Expose to window for cross-module callbacks in storage UI
window.__keno_highlightRound = highlightRound;
window.__keno_clearHighlight = clearHighlight;
window.__keno_updateHeatmap = updateHeatmap;

// Note: updateHeatmap is called on-demand via storage.js saveRound() callback
// No longer running on interval to improve performance with large datasets

