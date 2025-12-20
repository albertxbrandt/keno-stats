// src/stats.js - Calculate probability stats and last occurrence for multiplier bar
import { state } from '../core/state.js';
import { getHits, getMisses, getDrawn } from '../core/storage.js';
import { getSelectedTileNumbers } from './domReader.js';

/**
 * Calculate stats for selected tiles count
 * @param {number} selectedCount - Number of tiles currently selected
 * @param {Array<number>} selectedNumbers - Array of currently selected tile numbers
 * @returns {Object} Stats object with probabilities and last occurrences
 */
export function calculateMultiplierStats(selectedCount, selectedNumbers = []) {
    if (selectedCount === 0 || state.currentHistory.length === 0) {
        return { probabilities: {}, lastOccurrences: {} };
    }

    const stats = {
        probabilities: {},
        lastOccurrences: {},
        lastOccurrenceIndices: {},
        counts: {}
    };

    // Initialize counters for each possible hit count (0 to selectedCount)
    for (let i = 0; i <= selectedCount; i++) {
        stats.counts[i] = 0;
        stats.probabilities[i] = 0;
        stats.lastOccurrences[i] = null;
        stats.lastOccurrenceIndices[i] = null;
    }

    // Analyze history (go from newest to oldest to find last occurrence)
    const reversedHistory = state.currentHistory.slice().reverse();

    reversedHistory.forEach((round, idx) => {
        // Count how many of the currently selected numbers were hits in this round
        let hitCount;

        if (selectedNumbers.length > 0) {
            // Compare current selection with the drawn numbers from this round
            const drawnNumbers = getDrawn(round);
            const matchingNumbers = selectedNumbers.filter(num => drawnNumbers.includes(num));
            hitCount = matchingNumbers.length;
        } else {
            // Fallback to old behavior if no specific numbers provided
            hitCount = getHits(round).length;
        }

        // Record this round for ALL hit counts from hitCount down to 0
        // Example: if hitCount is 5, this round also had 4, 3, 2, 1, and 0 hits
        for (let i = 0; i <= hitCount && i <= selectedCount; i++) {
            stats.counts[i]++;

            // Record last occurrence (first time we see it in reversed history = most recent)
            if (stats.lastOccurrences[i] === null) {
                stats.lastOccurrences[i] = round.time;
                // Store the actual index in the original history array
                stats.lastOccurrenceIndices[i] = state.currentHistory.length - 1 - idx;
            }
        }
    });

    // Calculate probabilities
    const totalRounds = state.currentHistory.length;
    for (let i = 0; i <= selectedCount; i++) {
        stats.probabilities[i] = totalRounds > 0 ? (stats.counts[i] / totalRounds) : 0;
    }

    return stats;
}

/**
 * Format bet info for display by finding most recent matching bet
 * @param {Array<number>} selectedNumbers - Currently selected numbers
 * @param {number} targetHitCount - Target hit count to match
 * @returns {string} Bet number and bets ago info
 */
export function formatTimeSince(selectedNumbers, targetHitCount) {
    if (!selectedNumbers || selectedNumbers.length === 0) return 'Never';

    // Find the most recent bet that matches the target hit count
    for (let i = state.currentHistory.length - 1; i >= 0; i--) {
        const round = state.currentHistory[i];
        const drawnNumbers = getDrawn(round);
        const matchingNumbers = selectedNumbers.filter(num => drawnNumbers.includes(num));
        const hitCount = matchingNumbers.length;

        if (hitCount === targetHitCount) {
            const betNumber = i + 1;
            const betsAgo = state.currentHistory.length - i;
            return `Bet #${betNumber}<br>${betsAgo} Bets Ago`;
        }
    }

    return 'Never';
}

/**
 * Update the multiplier bar with stats based on current selection
 */
export function updateMultiplierBarStats() {
    try {
        const selectedNumbers = getSelectedTileNumbers();
        const selectedCount = selectedNumbers.length;

        if (selectedCount === 0) {
            clearMultiplierBarStats();
            return;
        }

        const containers = findMultiplierContainers();

        if (containers.length === 0) {
            return; // Silently fail if multiplier bar not found
        }

        containers.forEach((container, index) => {
            const hitCount = index;

            // Skip 0x - not relevant
            if (hitCount === 0 || hitCount > selectedCount) return;

            const lastTime = formatTimeSince(selectedNumbers, hitCount);

            let statsOverlay = container.querySelector('.keno-stats-overlay');
            if (!statsOverlay) {
                statsOverlay = document.createElement('div');
                statsOverlay.className = 'keno-stats-overlay';
                Object.assign(statsOverlay.style, {
                    position: 'absolute',
                    bottom: '4px',
                    left: '4px',
                    right: '4px',
                    fontSize: '10px',
                    color: '#fff',
                    fontWeight: 'bold',
                    textAlign: 'center',
                    pointerEvents: 'auto',
                    backgroundColor: 'rgba(0,0,0,0.8)',
                    borderRadius: '4px',
                    padding: '2px 4px',
                    textShadow: '0 1px 2px rgba(0,0,0,0.5)',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    userSelect: 'none',
                    lineHeight: '1.3'
                });

                statsOverlay.addEventListener('mouseenter', () => {
                    Object.assign(statsOverlay.style, {
                        backgroundColor: 'rgba(0,150,255,0.9)',
                        transform: 'scale(1.05)'
                    });
                });

                statsOverlay.addEventListener('mouseleave', () => {
                    Object.assign(statsOverlay.style, {
                        backgroundColor: 'rgba(0,0,0,0.8)',
                        transform: 'scale(1)'
                    });
                });

                statsOverlay.addEventListener('click', () => {
                    // Get fresh selected numbers at click time, not creation time
                    const currentSelectedNumbers = getSelectedTileNumbers();
                    showBetResultModal(currentSelectedNumbers, hitCount);
                });

                // Store hit count in data attribute so we can update text later
                statsOverlay.dataset.hitCount = hitCount;

                container.style.position = 'relative';
                // Add padding to bottom of container so multiplier text doesn't overlap
                container.style.paddingBottom = '28px';
                container.appendChild(statsOverlay);
            }

            statsOverlay.innerHTML = lastTime;
        });
    } catch (error) {
        console.error('[stats] Error updating multiplier bar:', error);
    }
}

/**
 * Clear stats overlays from multiplier bar
 */
export function clearMultiplierBarStats() {
    try {
        const overlays = document.querySelectorAll('.keno-stats-overlay');
        overlays.forEach(overlay => overlay.remove());
    } catch (error) {
        console.error('[stats] Error clearing multiplier bar:', error);
    }
}

/**
 * Find multiplier container elements in the DOM
 * @returns {Array} Array of DOM elements
 */
function findMultiplierContainers() {
    try {
        // Target the hit-odds container (Svelte adds dynamic class suffixes)
        const hitOddsContainer = document.querySelector('[class*="hit-odds"]');
        if (!hitOddsContainer) {
            return [];
        }

        // Find all divs with class containing "hit" (both positive and negative)
        const multiplierDivs = Array.from(hitOddsContainer.querySelectorAll('div[class*="hit"]'));

        // Filter to get only the ones with multiplier text (0×, 1×, 2×, etc.)
        // Note: Uses × (multiplication sign U+00D7) not x (letter x)
        const multiplierElements = multiplierDivs.filter(el => {
            // Remove any existing stats overlay to get clean text
            const overlay = el.querySelector('.keno-stats-overlay');
            const text = overlay ? el.textContent.replace(overlay.textContent, '').trim() : el.textContent.trim();
            const matches = /^\d+[×x]\s*[🔒📦]?$/i.test(text);
            return matches;
        });

        // Sort by multiplier value (0x, 1x, 2x, 3x...)
        multiplierElements.sort((a, b) => {
            const aNum = parseInt(a.textContent.match(/(\d+)x/)?.[1] || '0');
            const bNum = parseInt(b.textContent.match(/(\d+)x/)?.[1] || '0');
            return aNum - bNum;
        });

        return multiplierElements;
    } catch (error) {
        console.error('[stats] Error finding multiplier containers:', error);
        return [];
    }
}

/**
 * Set up observer to watch for tile selection changes
 */
export function initStatsObserver() {
    try {
        const tilesContainer = document.querySelector('div[data-testid="game-keno"]');
        if (!tilesContainer) {
            setTimeout(initStatsObserver, 2000);
            return;
        }

        const observer = new MutationObserver(() => {
            try {
                updateMultiplierBarStats();
            } catch (error) {
                console.error('[stats] Observer callback error:', error);
            }
        });

        observer.observe(tilesContainer, {
            attributes: true,
            attributeFilter: ['aria-pressed', 'aria-checked', 'class', 'data-selected'],
            subtree: true
        });

        tilesContainer.addEventListener('click', () => {
            setTimeout(() => {
                try {
                    updateMultiplierBarStats();
                } catch (error) {
                    console.error('[stats] Click handler error:', error);
                }
            }, 100);
        });

        updateMultiplierBarStats();
    } catch (error) {
        console.error('[stats] Error initializing stats observer:', error);
    }
}

/**
 * Show a modal with bet result details
 * @param {Array<number>} selectedNumbers - Currently selected numbers (to highlight in modal)
 * @param {number} targetHitCount - How many of the selected numbers should have hit
 */
function showBetResultModal(selectedNumbers, targetHitCount) {
    // Find the most recent bet that matches the target hit count
    let betIndex = -1;
    let round = null;

    // Search from newest to oldest
    for (let i = state.currentHistory.length - 1; i >= 0; i--) {
        const r = state.currentHistory[i];
        const drawnNumbers = getDrawn(r);
        const matchingNumbers = selectedNumbers.filter(num => drawnNumbers.includes(num));
        const hitCount = matchingNumbers.length;

        if (hitCount === targetHitCount) {
            betIndex = i;
            round = r;
            break;
        }
    }

    if (!round || betIndex === -1) {
        console.error('[stats] No bet found matching', targetHitCount, 'hits for selection:', selectedNumbers);
        return;
    }

    // Create modal background
    const modalBg = document.createElement('div');
    Object.assign(modalBg.style, {
        position: 'fixed',
        top: '0',
        left: '0',
        width: '100%',
        height: '100%',
        backgroundColor: 'rgba(0,0,0,0.85)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: '10000',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    });

    // Create modal content
    const modal = document.createElement('div');
    Object.assign(modal.style, {
        backgroundColor: '#0f212e',
        borderRadius: '12px',
        padding: '16px',
        maxWidth: '600px',
        width: '92%',
        maxHeight: '85vh',
        overflow: 'auto',
        border: '2px solid #1a3a4a',
        boxShadow: '0 20px 60px rgba(0,200,83,0.15)',
        color: '#fff'
    });

    const dateStr = new Date(round.time).toLocaleString();

    // Calculate bet number and bets ago from the index
    const betNumber = betIndex + 1;
    const betsAgo = state.currentHistory.length - betIndex;

    // Use the stored hit and miss data from history
    // hits = selected numbers that were drawn (GREEN)
    // misses = drawn numbers that were NOT selected (RED)
    const hits = getHits(round).sort((a, b) => a - b);
    const misses = getMisses(round).sort((a, b) => a - b);


    modal.innerHTML = `
        <div style="position: relative; margin-bottom: 14px;">
            <button id="close-x" style="
                position: absolute;
                top: -8px;
                right: -8px;
                width: 24px;
                height: 24px;
                background: transparent;
                border: none;
                color: #ff4757;
                font-size: 24px;
                font-weight: 400;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: all 0.2s ease;
                padding: 0;
                line-height: 1;
            ">×</button>
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
                <h2 style="margin: 0 0 4px 0; color: #fff; font-size: 18px; font-weight: 600;">Bet Result</h2>
                <p style="margin: 0 0 2px 0; color: #74b9ff; font-size: 12px; font-weight: 600;">Bet #${betNumber} - ${betsAgo} Bets Ago</p>
                <p style="margin: 0; color: #aaa; font-size: 11px;">${dateStr}</p>
            </div>
        </div>
        
        <div style="margin-bottom: 12px; padding: 12px; background: linear-gradient(135deg, #00c85325, #00c85310); border-radius: 10px; border-left: 3px solid #00c853; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
            <p style="margin: 0 0 4px 0; color: #fff; font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Result</p>
            <p style="margin: 0; font-size: 20px; font-weight: 700; color: #00c853;">${hits.length} Hits</p>
        </div>
        
        <div style="margin-bottom: 12px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
            <p style="margin: 0 0 6px 0; color: #fff; font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Hits (${hits.length})</p>
            <div style="display: flex; flex-wrap: wrap; gap: 5px;" id="hits-board"></div>
        </div>
        
        <div style="margin-bottom: 12px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
            <p style="margin: 0 0 6px 0; color: #fff; font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Misses (${misses.length})</p>
            <div style="display: flex; flex-wrap: wrap; gap: 5px;" id="misses-board"></div>
        </div>
        
        <div style="margin-bottom: 14px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
            <p style="margin: 0 0 6px 0; color: #fff; font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Full Board (1-40)</p>
            <div style="display: grid; grid-template-columns: repeat(8, 1fr); gap: 4px;" id="full-board"></div>
        </div>
    `;

    // Populate hits board (green - your selected numbers that were drawn)
    const hitsBoard = modal.querySelector('#hits-board');
    hits.forEach(num => {
        const tile = document.createElement('div');
        Object.assign(tile.style, {
            width: '36px',
            height: '36px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(135deg, #00ff88, #00c853)',
            color: '#000',
            borderRadius: '6px',
            fontWeight: '700',
            fontSize: '12px',
            boxShadow: '0 3px 8px rgba(0,200,83,0.4)',
            border: '2px solid #00ff88'
        });
        tile.textContent = num;
        hitsBoard.appendChild(tile);
    });

    // Populate misses board (red - drawn numbers you didn't select)
    const missesBoard = modal.querySelector('#misses-board');
    misses.forEach(num => {
        const tile = document.createElement('div');
        Object.assign(tile.style, {
            width: '36px',
            height: '36px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#071824',
            color: '#ff6b5b',
            borderRadius: '6px',
            fontWeight: '700',
            fontSize: '12px',
            boxShadow: '0 3px 8px rgba(255,71,87,0.2)',
            border: '2px solid #ff6b5b'
        });
        tile.textContent = num;
        missesBoard.appendChild(tile);
    });

    // Populate full board (1-40)
    const fullBoard = modal.querySelector('#full-board');
    for (let i = 1; i <= 40; i++) {
        const tile = document.createElement('div');
        const isHit = hits.includes(i);
        const isMiss = misses.includes(i);
        const isCurrentlySelected = selectedNumbers.includes(i);

        let bgColor = '#2f4553';
        let textColor = '#fff';
        let borderStyle = '2px solid #2f4553';
        let boxShadow = 'none';

        if (isHit) {
            // Hit - your selected number that was drawn (green)
            bgColor = 'linear-gradient(135deg, #00ff88, #00c853)';
            textColor = '#000';
            borderStyle = '2px solid #00ff88';
            boxShadow = '0 3px 8px rgba(0,200,83,0.4)';
        } else if (isMiss) {
            // Miss - drawn number you didn't select (red)
            bgColor = '#071824';
            textColor = '#ff6b5b';
            borderStyle = '2px solid #ff6b5b';
            boxShadow = '0 3px 8px rgba(255,71,87,0.2)';
        }

        // Add dashed yellow border for currently selected numbers
        if (isCurrentlySelected) {
            borderStyle = '3px dashed #ffa500';
        }

        Object.assign(tile.style, {
            width: '100%',
            aspectRatio: '1',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: bgColor,
            color: textColor,
            borderRadius: '5px',
            fontWeight: '700',
            fontSize: '10px',
            border: borderStyle,
            boxShadow: boxShadow,
            transition: 'all 0.2s ease'
        });
        tile.textContent = i;
        fullBoard.appendChild(tile);
    }

    modalBg.appendChild(modal);
    document.body.appendChild(modalBg);

    const closeBtn = modal.querySelector('#close-x');
    closeBtn.addEventListener('mouseenter', () => {
        closeBtn.style.transform = 'scale(1.2)';
        closeBtn.style.color = '#ff6b6b';
    });
    closeBtn.addEventListener('mouseleave', () => {
        closeBtn.style.transform = 'scale(1)';
        closeBtn.style.color = '#ff4757';
    });
    closeBtn.addEventListener('click', () => {
        modalBg.remove();
    });

    modalBg.addEventListener('click', (e) => {
        if (e.target === modalBg) {
            modalBg.remove();
        }
    });
}
