// src/storage.js
import { state } from './state.js';

const storageApi = (typeof browser !== 'undefined') ? browser : chrome;

export function saveRound(round) {
    return storageApi.storage.local.get('history').then((res) => {
        let history = res.history || [];
        history.push(round);
        // Store unlimited history (bet book needs full history)
        return storageApi.storage.local.set({ history }).then(() => {
            state.currentHistory = history;
            // Update UI live when a new round is saved
            try {
                updateHistoryUI(history);
            } catch (e) {
                // updateHistoryUI may be unavailable early; ignore
                console.warn('[storage] updateHistoryUI failed', e);
            }
            // Trigger heatmap refresh if available
            if (window.__keno_updateHeatmap) {
                try { window.__keno_updateHeatmap(); } catch (e) { console.warn('[storage] updateHeatmap failed', e); }
            }
            return history;
        });
    });
}

export function loadHistory() {
    return storageApi.storage.local.get('history').then(res => {
        state.currentHistory = res.history || [];
        return state.currentHistory;
    });
}

export function clearHistory() {
    return storageApi.storage.local.set({ history: [] }).then(() => {
        state.currentHistory = [];
        return state.currentHistory;
    });
}

export function updateHistoryUI(history) {
    const list = document.getElementById('history-list');
    if (!list) return;
    list.innerHTML = '';
    
    // Update sample size input max value
    const sampleInput = document.getElementById('sample-size-input');
    if (sampleInput) {
        sampleInput.max = Math.max(history.length, 1);
    }
    
    history.slice().reverse().forEach((round, i) => {
        const div = document.createElement('div');
        div.style.borderBottom = '1px solid #333';
        div.style.padding = '4px 0';
        div.style.cursor = 'pointer';
        div.addEventListener('mouseenter', () => {
            // visually highlight the hovered history entry
            div.style.backgroundColor = '#13313b';
            div.style.borderRadius = '4px';
            // highlightRound is defined in heatmap module; call via window hook
            if (window.__keno_highlightRound) window.__keno_highlightRound(round);
        });
        div.addEventListener('mouseleave', () => {
            div.style.backgroundColor = 'transparent';
            div.style.borderRadius = '';
            if (window.__keno_clearHighlight) window.__keno_clearHighlight();
        });
        div.innerHTML = `
            <span style="color:#888">#${history.length - i}</span>
            <span style="color:#00b894">H:${round.hits.length}</span>
            <span style="color:#ff7675">M:${round.misses.length}</span>
            <div style="color:#666; font-size:10px;">${round.hits.join(',') || '-'} / ${round.misses.join(',') || '-'}</div>
        `;
        list.appendChild(div);
    });
}
