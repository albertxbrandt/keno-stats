// src/stats.js - Calculate probability stats and last occurrence for multiplier bar
import { state } from '@/keno-tool/core/state.js';
import { getHits, getMisses, getDrawn } from '@/keno-tool/core/storage.js';
import { getSelectedTileNumbers } from './dom/domReader.js';
import { render } from 'preact';
import { BetResultModal } from '@/keno-tool/ui/components/modals/BetResultModal.jsx';

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
            const matches = /^\d+[×x]\s*[🔒📦]?$/iu.test(text);
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
 * Show a modal with bet result details using Preact
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

    // Get hits and misses
    const hits = getHits(round).sort((a, b) => a - b);
    const misses = getMisses(round).sort((a, b) => a - b);

    // Create container for Preact modal
    const container = document.createElement('div');
    container.id = 'bet-result-modal-container';
    document.body.appendChild(container);

    // Close handler
    const handleClose = () => {
        render(null, container);
        container.remove();
    };

    // Render Preact modal
    render(
        <BetResultModal
            round={round}
            betIndex={betIndex}
            totalRounds={state.currentHistory.length}
            hits={hits}
            misses={misses}
            selectedNumbers={selectedNumbers}
            onClose={handleClose}
        />,
        container
    );
}
