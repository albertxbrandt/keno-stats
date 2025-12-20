// src/storage.js
import { state } from './state.js';

const storageApi = (typeof browser !== 'undefined') ? browser : chrome;

// Performance: Use chunked storage to avoid rewriting entire 20k+ history
const CHUNK_SIZE = 1000; // Store 1000 rounds per chunk
let pendingWrite = null;
let writeTimeout = null;

function getChunkKey(index) {
    return `history_chunk_${Math.floor(index / CHUNK_SIZE)}`;
}

function queueStorageWrite(round, totalCount) {
    // Cancel pending write
    if (writeTimeout) {
        clearTimeout(writeTimeout);
    }

    // Store the round to write
    pendingWrite = { round, totalCount };

    // Debounce: write after 100ms of no new rounds
    writeTimeout = setTimeout(() => {
        if (pendingWrite) {
            const { round, totalCount } = pendingWrite;
            const chunkKey = getChunkKey(totalCount - 1);

            // Get current chunk, append round, write back
            storageApi.storage.local.get([chunkKey, 'history_count']).then(res => {
                let chunk = res[chunkKey] || [];
                chunk.push(round);

                const writeData = {
                    [chunkKey]: chunk,
                    history_count: totalCount
                };

                return storageApi.storage.local.set(writeData);
            }).catch(e => {
                console.error('[storage] Failed to write chunk:', e);
            });

            pendingWrite = null;
        }
    }, 100);
}

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
    // Append to in-memory state immediately (no lag)
    state.currentHistory.push(round);
    const totalCount = state.currentHistory.length;

    // Queue the chunked write (only writes one chunk, not entire history)
    queueStorageWrite(round, totalCount);

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

    // Defer non-critical UI updates to avoid blocking main thread
    setTimeout(() => {
        // Update UI live when a new round is saved
        try {
            updateHistoryUI(state.currentHistory);
        } catch (e) {
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
        // Dispatch event for live pattern updates
        window.dispatchEvent(new CustomEvent('kenoNewRound', { detail: { history: state.currentHistory } }));
    }, 0);

    return Promise.resolve(state.currentHistory);
}

export function loadHistory() {
    // Load from chunked storage or fall back to old format
    return storageApi.storage.local.get(['history_count', 'history']).then(res => {
        if (res.history_count) {
            // New chunked format: load all chunks
            const chunkCount = Math.ceil(res.history_count / CHUNK_SIZE);
            const chunkKeys = [];
            for (let i = 0; i < chunkCount; i++) {
                chunkKeys.push(`history_chunk_${i}`);
            }

            return storageApi.storage.local.get(chunkKeys).then(chunks => {
                state.currentHistory = [];
                for (let i = 0; i < chunkCount; i++) {
                    const chunk = chunks[`history_chunk_${i}`] || [];
                    state.currentHistory.push(...chunk);
                }
                return state.currentHistory;
            });
        } else if (res.history) {
            // Old format: migrate to chunked storage
            state.currentHistory = res.history;

            // Migrate in background
            setTimeout(() => {
                const totalCount = state.currentHistory.length;
                const chunkCount = Math.ceil(totalCount / CHUNK_SIZE);
                const writeData = { history_count: totalCount };

                for (let i = 0; i < chunkCount; i++) {
                    const start = i * CHUNK_SIZE;
                    const end = Math.min(start + CHUNK_SIZE, totalCount);
                    const chunk = state.currentHistory.slice(start, end);
                    writeData[`history_chunk_${i}`] = chunk;
                }

                storageApi.storage.local.set(writeData).then(() => {
                    // Remove old format
                    storageApi.storage.local.remove('history');
                }).catch(e => console.error('[storage] Migration failed:', e));
            }, 1000);

            return state.currentHistory;
        } else {
            state.currentHistory = [];
            return state.currentHistory;
        }
    });
}

export function clearHistory() {
    return storageApi.storage.local.clear().then(() => {
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

/**
 * Save all generator settings to storage (auto-save system)
 * Persists 11 settings: method, count, interval, auto-select, sample size, shapes, momentum
 * Call this immediately after ANY generator setting changes in UI
 * @example
 * methodSelect.addEventListener('change', (e) => {
 *   state.generatorMethod = e.target.value;
 *   saveGeneratorSettings(); // Auto-save immediately
 * });
 */
export function saveGeneratorSettings() {
    const settings = {
        generatorMethod: state.generatorMethod,
        generatorCount: state.generatorCount,
        generatorInterval: state.generatorInterval,
        generatorAutoRefresh: state.generatorAutoRefresh,
        generatorSampleSize: state.generatorSampleSize,
        // Shapes settings
        shapesPattern: state.shapesPattern,
        shapesPlacement: state.shapesPlacement,
        // Momentum settings
        momentumDetectionWindow: state.momentumDetectionWindow,
        momentumBaselineGames: state.momentumBaselineGames,
        momentumThreshold: state.momentumThreshold,
        momentumPoolSize: state.momentumPoolSize
    };

    storageApi.storage.local.set({ generatorSettings: settings });
}

/**
 * Load generator settings from storage
 */
export function loadGeneratorSettings() {
    return storageApi.storage.local.get('generatorSettings').then(res => {
        if (res.generatorSettings) {
            const settings = res.generatorSettings;

            // Apply settings to state
            if (settings.generatorMethod !== undefined) state.generatorMethod = settings.generatorMethod;
            if (settings.generatorCount !== undefined) state.generatorCount = settings.generatorCount;
            if (settings.generatorInterval !== undefined) state.generatorInterval = settings.generatorInterval;
            if (settings.generatorAutoRefresh !== undefined) state.generatorAutoRefresh = settings.generatorAutoRefresh;
            if (settings.generatorSampleSize !== undefined) state.generatorSampleSize = settings.generatorSampleSize;

            // Shapes settings
            if (settings.shapesPattern !== undefined) state.shapesPattern = settings.shapesPattern;
            if (settings.shapesPlacement !== undefined) state.shapesPlacement = settings.shapesPlacement;

            // Momentum settings
            if (settings.momentumDetectionWindow !== undefined) state.momentumDetectionWindow = settings.momentumDetectionWindow;
            if (settings.momentumBaselineGames !== undefined) state.momentumBaselineGames = settings.momentumBaselineGames;
            if (settings.momentumThreshold !== undefined) state.momentumThreshold = settings.momentumThreshold;
            if (settings.momentumPoolSize !== undefined) state.momentumPoolSize = settings.momentumPoolSize;

            return settings;
        }
        return null;
    });
}

/**
 * Save heatmap settings to storage
 */
export function saveHeatmapSettings() {
    const settings = {
        heatmapMode: state.heatmapMode,
        heatmapSampleSize: state.heatmapSampleSize
    };

    storageApi.storage.local.set({ heatmapSettings: settings });
}

/**
 * Load heatmap settings from storage
 */
export function loadHeatmapSettings() {
    return storageApi.storage.local.get('heatmapSettings').then(res => {
        if (res.heatmapSettings) {
            const settings = res.heatmapSettings;

            if (settings.heatmapMode !== undefined) state.heatmapMode = settings.heatmapMode;
            if (settings.heatmapSampleSize !== undefined) state.heatmapSampleSize = settings.heatmapSampleSize;

            return settings;
        }
        return null;
    });
}
