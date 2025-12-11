// src/storage.js
import { state } from './state.js';

const storageApi = (typeof browser !== 'undefined') ? browser : chrome;

/**
 * Calculate hits from bet data
 * @param {Object} bet - Bet object with kenoBet.state structure
 * @returns {Array<number>} Array of hit numbers
 */
export function getHits(bet) {
    if (!bet) return [];
    // Old format or plain object
    if (bet.hits) return bet.hits;
    // New format
    if (bet.kenoBet && bet.kenoBet.state) {
        const drawn = bet.kenoBet.state.drawnNumbers || [];
        const selected = bet.kenoBet.state.selectedNumbers || [];
        return selected.filter(num => drawn.includes(num)).sort((a, b) => a - b);
    }
    return [];
}

/**
 * Calculate misses from bet data
 * @param {Object} bet - Bet object with kenoBet.state structure
 * @returns {Array<number>} Array of miss numbers
 */
export function getMisses(bet) {
    if (!bet) return [];
    // Old format or plain object
    if (bet.misses) return bet.misses;
    // New format
    if (bet.kenoBet && bet.kenoBet.state) {
        const drawn = bet.kenoBet.state.drawnNumbers || [];
        const selected = bet.kenoBet.state.selectedNumbers || [];
        return drawn.filter(num => !selected.includes(num)).sort((a, b) => a - b);
    }
    return [];
}

/**
 * Get drawn numbers from bet data
 * @param {Object} bet - Bet object
 * @returns {Array<number>} Array of drawn numbers
 */
export function getDrawn(bet) {
    if (!bet) return [];
    // Old format
    if (bet.drawn) return bet.drawn;
    if (bet.hits && bet.misses) return [...bet.hits, ...bet.misses].sort((a, b) => a - b);
    // New format
    if (bet.kenoBet && bet.kenoBet.state && bet.kenoBet.state.drawnNumbers) {
        return bet.kenoBet.state.drawnNumbers;
    }
    return [];
}

/**
 * Get selected numbers from bet data
 * @param {Object} bet - Bet object
 * @returns {Array<number>} Array of selected numbers
 */
export function getSelected(bet) {
    if (!bet) return [];
    // Old format
    if (bet.selected) return bet.selected;
    // New format
    if (bet.kenoBet && bet.kenoBet.state && bet.kenoBet.state.selectedNumbers) {
        return bet.kenoBet.state.selectedNumbers;
    }
    return [];
}

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
            // Clear pattern cache when new data arrives
            if (window.__keno_clearPatternCache) {
                try { window.__keno_clearPatternCache(); } catch (e) { console.warn('[storage] clearPatternCache failed', e); }
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

    // Limit display to last 100 rounds
    const displayHistory = history.slice(-100);
    const startOffset = history.length - displayHistory.length;

    displayHistory.slice().reverse().forEach((round, i) => {
        const div = document.createElement('div');
        div.style.borderBottom = '1px solid #333';
        div.style.padding = '4px 0';
        div.style.cursor = 'pointer';

        // Calculate hits and misses from the new data structure
        const hits = getHits(round);
        const misses = getMisses(round);

        div.addEventListener('mouseenter', () => {
            // visually highlight the hovered history entry
            div.style.backgroundColor = '#13313b';
            div.style.borderRadius = '4px';
            // highlightRound is defined in heatmap module; call via window hook
            if (window.__keno_highlightRound) window.__keno_highlightRound({ hits, misses });
        });
        div.addEventListener('mouseleave', () => {
            div.style.backgroundColor = 'transparent';
            div.style.borderRadius = '';
            if (window.__keno_clearHighlight) window.__keno_clearHighlight();
        });
        div.innerHTML = `
            <span style="color:#888">#${history.length - startOffset - i}</span>
            <span style="color:#00b894">H:${hits.length}</span>
            <span style="color:#ff7675">M:${misses.length}</span>
            <div style="color:#666; font-size:10px;">${hits.join(',') || '-'} / ${misses.join(',') || '-'}</div>
        `;
        list.appendChild(div);
    });
}
