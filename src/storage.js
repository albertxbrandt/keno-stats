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

            // Update profit/loss if data is available
            if (round.kenoBet && round.kenoBet.amount && round.kenoBet.payout !== undefined) {
                const betAmount = parseFloat(round.kenoBet.amount) || 0;
                const payout = parseFloat(round.kenoBet.payout) || 0;
                const profit = payout - betAmount;
                const currency = (round.kenoBet.currency || 'btc').toLowerCase();

                // Update session profit only via profitLoss module if available
                if (window.__keno_updateProfit) {
                    try {
                        window.__keno_updateProfit(profit, currency);
                    } catch (e) {
                        console.warn('[storage] updateProfit failed', e);
                    }
                }

                // Recalculate total profit from history
                if (window.__keno_recalculateTotalProfit) {
                    try {
                        window.__keno_recalculateTotalProfit();
                    } catch (e) {
                        console.warn('[storage] recalculateTotalProfit failed', e);
                    }
                }
            }

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
            // Update momentum predictions if active
            if (window.__keno_updateMomentumPredictions) {
                try { window.__keno_updateMomentumPredictions(); } catch (e) { console.warn('[storage] updateMomentumPredictions failed', e); }
            }
            // Dispatch event for live pattern updates
            window.dispatchEvent(new CustomEvent('kenoNewRound', { detail: { history } }));
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

    // Update sample size input max value
    const sampleInput = document.getElementById('sample-size-input');
    if (sampleInput) {
        sampleInput.max = Math.max(history.length, 1);
    }

    // Performance optimization: Only update if the history list is visible or just changed
    // Check if overlay is visible
    const overlay = document.getElementById('keno-tracker-overlay');
    if (!overlay || overlay.style.display === 'none') {
        // Defer update until overlay is shown
        return;
    }

    // Limit display to last 100 rounds for performance
    const displayHistory = history.slice(-100);
    const startOffset = history.length - displayHistory.length;

    // Only fully rebuild if significantly different (avoid rebuilding on every single round)
    const currentChildren = list.children.length;
    const expectedChildren = Math.min(displayHistory.length, 100);

    // If just adding one round, prepend instead of full rebuild
    if (currentChildren === expectedChildren - 1 && expectedChildren > 1) {
        const round = displayHistory[displayHistory.length - 1];
        const hits = getHits(round);
        const misses = getMisses(round);
        const div = createHistoryItem(round, history.length, hits, misses);
        list.insertBefore(div, list.firstChild);

        // Remove last child if over limit
        if (list.children.length > 100) {
            list.removeChild(list.lastChild);
        }
        return;
    }

    // Full rebuild
    list.innerHTML = '';
    displayHistory.slice().reverse().forEach((round, i) => {
        const hits = getHits(round);
        const misses = getMisses(round);
        const div = createHistoryItem(round, history.length - i, hits, misses);
        list.appendChild(div);
    });
}

// Helper function to create a history item element
function createHistoryItem(round, roundNumber, hits, misses) {
    const div = document.createElement('div');
    div.style.borderBottom = '1px solid #333';
    div.style.padding = '4px 0';
    div.style.cursor = 'pointer';

    div.addEventListener('mouseenter', () => {
        div.style.backgroundColor = '#13313b';
        div.style.borderRadius = '4px';
        if (window.__keno_highlightRound) window.__keno_highlightRound({ hits, misses });
    });
    div.addEventListener('mouseleave', () => {
        div.style.backgroundColor = 'transparent';
        div.style.borderRadius = '';
        if (window.__keno_clearHighlight) window.__keno_clearHighlight();
    });
    div.innerHTML = `
        <span style="color:#888">#${roundNumber}</span>
        <span style="color:#00b894">H:${hits.length}</span>
        <span style="color:#ff7675">M:${misses.length}</span>
        <div style="color:#666; font-size:10px;">${hits.join(',') || '-'} / ${misses.join(',') || '-'}</div>
    `;
    return div;
}
