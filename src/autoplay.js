// src/autoplay.js
import { state } from './state.js';
import { saveRound } from './storage.js';
import { simulatePointerClick, findAndClickPlayButton } from './utils.js';
import { highlightPrediction } from './heatmap.js';

function isTileSelected(tile) {
    try {
        const ariaPressed = tile.getAttribute('aria-pressed');
        if (ariaPressed === 'true') return true;
        const ariaChecked = tile.getAttribute('aria-checked');
        if (ariaChecked === 'true') return true;
        const className = (tile.className || '').toString();
        if (/\bselected\b|\bactive\b|\bis-active\b|\bpicked\b|\bchosen\b/i.test(className)) return true;
        if (tile.dataset && (tile.dataset.selected === 'true' || tile.dataset.active === 'true')) return true;
    } catch (e) {}
    return false;
}

export function getTopPredictions(count) {
    const counts = {};
    let sample = state.isHotMode ? state.currentHistory.slice(-5) : state.currentHistory;
    sample.forEach(round => {
        const allHits = [...round.hits, ...round.misses];
        allHits.forEach(num => { counts[num] = (counts[num] || 0) + 1; });
    });
    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    const capped = Math.min(count, 40);
    return sorted.slice(0, capped).map(entry => parseInt(entry[0]));
}

export function generateRandomPrediction(count) {
    const predictions = [];
    const available = Array.from({length:40}, (_,i) => i+1);
    const capped = Math.min(count, 40);
    for (let i=0;i<capped;i++) {
        const idx = Math.floor(Math.random()*available.length);
        predictions.push(available[idx]);
        available.splice(idx,1);
    }
    return predictions.sort((a,b)=>a-b);
}

export function updateAutoPlayUI() {
    const apStatus = document.getElementById('autoplay-status');
    const apBtn = document.getElementById('autoplay-btn');
    if (apStatus) {
        if (state.isAutoPlayMode) {
            apStatus.innerText = `Playing: ${state.autoPlayRoundsRemaining}`;
            apStatus.style.color = '#74b9ff';
        } else {
            apStatus.innerText = 'Ready';
            apStatus.style.color = '#aaa';
        }
    }
    if (apBtn) {
        apBtn.innerText = state.isAutoPlayMode ? 'Stop' : 'Play';
        apBtn.style.backgroundColor = state.isAutoPlayMode ? '#ff7675' : '#00b894';
    }
}

export function calculatePrediction(countOverride) {
    const input = document.getElementById('predict-count');
    const count = parseInt((input && input.value) || countOverride) || 3;
    if (state.currentHistory.length === 0) return [];
    const counts = {};
    let sample = state.isHotMode ? state.currentHistory.slice(-5) : state.currentHistory;
    sample.forEach(round => {
        const allHits = [...round.hits, ...round.misses];
        allHits.forEach(num => { counts[num] = (counts[num] || 0) + 1; });
    });
    const sorted = Object.entries(counts).sort((a,b)=>b[1]-a[1]);
    const topPicks = sorted.slice(0, count).map(entry => parseInt(entry[0]));
    highlightPrediction(topPicks);
    return topPicks;
}

export function autoPlayPlaceBet() {
    const container = document.querySelector('div[data-testid="keno-tiles"]');
    if (!container) return;
    const tiles = Array.from(container.querySelectorAll('button'));
    // Deselect currently selected
    const currentlySelected = tiles.filter(isTileSelected);
    if (currentlySelected.length > 0) console.log('[AutoPlay] Deselecting tiles:', currentlySelected.map(t => parseInt((t.textContent||'').trim().split('%')[0])));
    currentlySelected.forEach(t => { try { simulatePointerClick(t); } catch (e) { try { t.click(); } catch {} } t.style.boxShadow=''; t.style.transform=''; t.style.opacity='1'; });
    // Predictions
    let predictions = [];
    if (state.currentHistory.length === 0) predictions = generateRandomPrediction(state.autoPlayPredictionCount);
    else predictions = getTopPredictions(state.autoPlayPredictionCount);
    if (!predictions || predictions.length === 0) predictions = generateRandomPrediction(state.autoPlayPredictionCount);
    predictions = predictions.slice(0, state.autoPlayPredictionCount);
    console.log('[AutoPlay] Predictions:', predictions);
    highlightPrediction(predictions);
    setTimeout(()=>{
        const clicked = [];
        const numToTile = {};
        tiles.forEach(tile => { const numText = (tile.textContent||'').trim(); const num = parseInt(numText.split('%')[0]); if (!isNaN(num)) numToTile[num]=tile; });
        const uniquePreds = [...new Set(predictions)].slice(0, state.autoPlayPredictionCount);
        uniquePreds.forEach(num => {
            const tile = numToTile[num];
            if (!tile) return;
            if (!isTileSelected(tile)) simulatePointerClick(tile);
            else { tile.style.boxShadow = "inset 0 0 0 4px #74b9ff"; tile.style.transform = "scale(1.05)"; }
            clicked.push(num);
        });
        if (clicked.length < state.autoPlayPredictionCount) {
            const needed = state.autoPlayPredictionCount - clicked.length;
            const availableNums = Object.keys(numToTile).map(n=>parseInt(n)).filter(n=>!clicked.includes(n));
            for (let i=0;i<needed && availableNums.length>0;i++){
                const idx = Math.floor(Math.random()*availableNums.length);
                const pick = availableNums.splice(idx,1)[0];
                const tile = numToTile[pick]; if (tile) { simulatePointerClick(tile); clicked.push(pick); }
            }
        }
        tiles.forEach(tile=>{ const numText=(tile.textContent||'').trim(); const num=parseInt(numText.split('%')[0]); if (isNaN(num)) return; if (!clicked.includes(num)) tile.style.opacity='0.4'; });
        console.log('[AutoPlay] Clicked predicted tiles (final):', clicked);
        const playBtn = findAndClickPlayButton();
        if (!playBtn) {
            console.warn('[AutoPlay] could not find play button, will retry');
            setTimeout(()=>{ const retry = findAndClickPlayButton(); if (!retry) { setTimeout(()=>{ const retry2 = findAndClickPlayButton(); if (!retry2) console.warn('[AutoPlay] Play button not found'); else console.log('[AutoPlay] Play clicked 2nd retry'); },450); } else console.log('[AutoPlay] Play clicked on retry'); },450);
        } else console.log('[AutoPlay] Play button clicked');
    },350);
}

// Expose calculatePrediction for heatmap/pred UI
window.__keno_calculatePrediction = calculatePrediction;

