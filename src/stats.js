// src/stats.js - Calculate probability stats and last occurrence for multiplier bar
import { state } from './state.js';

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
        counts: {}
    };

    // Initialize counters for each possible hit count (0 to selectedCount)
    for (let i = 0; i <= selectedCount; i++) {
        stats.counts[i] = 0;
        stats.probabilities[i] = 0;
        stats.lastOccurrences[i] = null;
    }

    // Analyze history (go from newest to oldest to find last occurrence)
    const reversedHistory = state.currentHistory.slice().reverse();
    
    console.log('[stats] Analyzing history for selection:', selectedNumbers, 'Total rounds:', reversedHistory.length);
    
    reversedHistory.forEach((round, idx) => {
        // Count how many of the currently selected numbers were hits in this round
        let hitCount;
        
        if (selectedNumbers.length > 0) {
            // Compare current selection with the drawn numbers from this round
            // Use 'drawn' if available (new format), fallback to 'hits' (old format)
            const drawnNumbers = round.drawn || round.hits;
            const matchingNumbers = selectedNumbers.filter(num => drawnNumbers.includes(num));
            hitCount = matchingNumbers.length;
            
            if (idx < 3) { // Log first 3 rounds for debugging
                console.log(`[stats] Round ${idx} (${new Date(round.time).toLocaleTimeString()}):`, 
                    'drawn:', drawnNumbers, 
                    'selected:', selectedNumbers,
                    'matches:', matchingNumbers,
                    'hitCount:', hitCount);
            }
        } else {
            // Fallback to old behavior if no specific numbers provided
            hitCount = round.hits.length;
        }
        
        // Record this round for ALL hit counts from hitCount down to 0
        // Example: if hitCount is 5, this round also had 4, 3, 2, 1, and 0 hits
        for (let i = 0; i <= hitCount && i <= selectedCount; i++) {
            stats.counts[i]++;
            
            // Record last occurrence (first time we see it in reversed history = most recent)
            if (stats.lastOccurrences[i] === null) {
                stats.lastOccurrences[i] = round.time;
                if (idx < 3) {
                    console.log(`[stats] Found last occurrence for ${i}×: ${new Date(round.time).toLocaleTimeString()}`);
                }
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
 * Format time difference for display
 * @param {number} timestamp - Unix timestamp
 * @returns {string} Human-readable time difference
 */
export function formatTimeSince(timestamp) {
    if (!timestamp) return 'Never';
    
    const now = Date.now();
    const diff = now - timestamp;
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return `${seconds}s ago`;
}

/**
 * Get currently selected tile numbers from DOM
 * @returns {Array<number>} Array of selected tile numbers (1-40)
 */
export function getSelectedTileNumbers() {
    try {
        const tilesContainer = document.querySelector('div[data-testid="keno-tiles"]');
        if (!tilesContainer) return [];

        const tiles = Array.from(tilesContainer.querySelectorAll('button'));
        const selectedNumbers = [];

        tiles.forEach((tile, index) => {
            const isSelected = 
                tile.getAttribute('aria-pressed') === 'true' || 
                tile.getAttribute('aria-checked') === 'true' ||
                /\bselected\b|\bactive\b|\bis-active\b|\bpicked\b|\bchosen\b/i.test(tile.className || '') ||
                (tile.dataset && (tile.dataset.selected === 'true' || tile.dataset.active === 'true'));
            
            if (isSelected) {
                // Tiles are 1-40, index is 0-39
                selectedNumbers.push(index + 1);
            }
        });

        return selectedNumbers.sort((a, b) => a - b);
    } catch (error) {
        console.error('[stats] Error getting selected tile numbers:', error);
        return [];
    }
}

/**
 * Get currently selected tile count by checking DOM
 * @returns {number} Number of selected tiles
 */
export function getSelectedTileCount() {
    return getSelectedTileNumbers().length;
}

/**
 * Update the multiplier bar with stats based on current selection
 */
export function updateMultiplierBarStats() {
    console.warn('[STATS] updateMultiplierBarStats called');
    try {
        const selectedNumbers = getSelectedTileNumbers();
        const selectedCount = selectedNumbers.length;
        
        if (selectedCount === 0) {
            clearMultiplierBarStats();
            return;
        }

        const stats = calculateMultiplierStats(selectedCount, selectedNumbers);
        const containers = findMultiplierContainers();
        
        console.warn('[stats] Selected count:', selectedCount, 'Selected numbers:', selectedNumbers, 'Stats:', stats, 'Containers found:', containers.length);
        
        if (containers.length === 0) {
            return; // Silently fail if multiplier bar not found
        }

        containers.forEach((container, index) => {
            const hitCount = index;
            
            // Skip 0x - not relevant
            if (hitCount === 0 || hitCount > selectedCount) return;
            
            const lastTime = formatTimeSince(stats.lastOccurrences[hitCount]);
            
            console.log(`[stats] ${hitCount}×: last: ${lastTime} (timestamp: ${stats.lastOccurrences[hitCount]})`);
            
            let statsOverlay = container.querySelector('.keno-stats-overlay');
            if (!statsOverlay) {
                statsOverlay = document.createElement('div');
                statsOverlay.className = 'keno-stats-overlay';
                Object.assign(statsOverlay.style, {
                    position: 'absolute',
                    bottom: '4px',
                    left: '4px',
                    right: '4px',
                    fontSize: '11px',
                    color: '#fff',
                    fontWeight: 'bold',
                    textAlign: 'center',
                    pointerEvents: 'auto',
                    backgroundColor: 'rgba(0,0,0,0.8)',
                    borderRadius: '4px',
                    padding: '3px 4px',
                    textShadow: '0 1px 2px rgba(0,0,0,0.5)',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    userSelect: 'none'
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
                    const timestamp = stats.lastOccurrences[hitCount];
                    showBetResultModal(timestamp, selectedNumbers, hitCount);
                });
                
                container.style.position = 'relative';
                container.appendChild(statsOverlay);
            }
            
            statsOverlay.textContent = lastTime;
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
            console.warn('[stats] hit-odds container not found');
            return [];
        }

        console.log('[stats] Found hit-odds container:', hitOddsContainer);

        // Find all divs with class containing "hit" (both positive and negative)
        const multiplierDivs = Array.from(hitOddsContainer.querySelectorAll('div[class*="hit"]'));
        
        console.log('[stats] All divs with hit class:', multiplierDivs.length, multiplierDivs.map(el => ({
            className: el.className,
            textContent: el.textContent.trim(),
            innerHTML: el.innerHTML.substring(0, 100)
        })));
        
        // Filter to get only the ones with multiplier text (0×, 1×, 2×, etc.)
        // Note: Uses × (multiplication sign U+00D7) not x (letter x)
        const multiplierElements = multiplierDivs.filter(el => {
            // Remove any existing stats overlay to get clean text
            const overlay = el.querySelector('.keno-stats-overlay');
            const text = overlay ? el.textContent.replace(overlay.textContent, '').trim() : el.textContent.trim();
            const matches = /^\d+[×x]\s*[🔒📦]?$/i.test(text);
            console.log('[stats] Testing text:', el.textContent.trim(), 'Clean text:', text, 'Matches:', matches);
            if (matches) console.log('[stats] Found multiplier:', text, el);
            return matches;
        });

        // Sort by multiplier value (0x, 1x, 2x, 3x...)
        multiplierElements.sort((a, b) => {
            const aNum = parseInt(a.textContent.match(/(\d+)x/)?.[1] || '0');
            const bNum = parseInt(b.textContent.match(/(\d+)x/)?.[1] || '0');
            return aNum - bNum;
        });

        console.log('[stats] Found multiplier containers:', multiplierElements.length, multiplierElements.map(el => el.textContent.trim()));
        
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
    console.warn('[STATS] initStatsObserver called!!!');
    try {
        const tilesContainer = document.querySelector('div[data-testid="keno-tiles"]');
        if (!tilesContainer) {
            console.warn('[stats] Keno tiles container not found, retrying in 2s');
            setTimeout(initStatsObserver, 2000);
            return;
        }

        console.log('[stats] Tiles container found, setting up observer');

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
            console.log('[stats] Tile clicked, updating stats in 100ms');
            setTimeout(() => {
                try {
                    updateMultiplierBarStats();
                } catch (error) {
                    console.error('[stats] Click handler error:', error);
                }
            }, 100);
        });

        updateMultiplierBarStats();
        
        console.log('[stats] Stats observer initialized successfully');
    } catch (error) {
        console.error('[stats] Error initializing stats observer:', error);
    }
}

/**
 * Show a modal with bet result details
 * @param {number} timestamp - Unix timestamp of the bet
 * @param {Array<number>} selectedNumbers - Numbers that were selected
 * @param {number} hitCount - How many of the selected numbers hit
 */
function showBetResultModal(timestamp, selectedNumbers, hitCount) {
    // Find the round in history
    const round = state.currentHistory.find(r => r.time === timestamp);
    if (!round) {
        console.error('[stats] Round not found:', timestamp);
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

    const dateStr = new Date(timestamp).toLocaleString();
    
    // Reconstruct the original selected numbers from that round
    // For new rounds: use round.selected (stored with the round data)
    // For old rounds: hits + misses together = the original selection
    //   (because hits are selected numbers that were drawn, 
    //    and misses are drawn numbers that weren't selected)
    let originalSelected;
    if (round.selected && round.selected.length > 0) {
        originalSelected = round.selected;
    } else {
        // Old format: reconstruct from hits + misses
        originalSelected = [...(round.hits || []), ...(round.misses || [])].sort((a, b) => a - b);
    }
    
    const hitsFromOriginal = round.hits.filter(n => originalSelected.includes(n)).sort((a,b) => a-b);
    const missesFromOriginal = originalSelected.filter(n => !round.hits.includes(n)).sort((a,b) => a-b);
    
    // Show what matched from CURRENT selection (for reference)
    const currentMatches = selectedNumbers.filter(n => round.hits.includes(n)).sort((a,b) => a-b);
    
    console.log('[stats] Modal data:', { originalSelected, hitsFromOriginal, missesFromOriginal, currentMatches, selectedNumbers });

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
                <p style="margin: 0; color: #fff; font-size: 11px;">${dateStr}</p>
                <p style="margin: 3px 0 0 0; color: #00c853; font-size: 10px; font-weight: 500;">Selected: ${originalSelected.join(', ')}</p>
            </div>
        </div>
        
        <div style="margin-bottom: 12px; padding: 12px; background: linear-gradient(135deg, #00c85325, #00c85310); border-radius: 10px; border-left: 3px solid #00c853; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
            <p style="margin: 0 0 4px 0; color: #fff; font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Result</p>
            <p style="margin: 0; font-size: 20px; font-weight: 700; color: #00c853;">${hitsFromOriginal.length}/${originalSelected.length}</p>
            ${currentMatches.length !== hitsFromOriginal.length ? `<p style="margin: 6px 0 0 0; color: #ffa500; font-size: 10px;">Your selection matched ${currentMatches.length} from this round</p>` : ''}
        </div>
        
        <div style="margin-bottom: 12px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
            <p style="margin: 0 0 6px 0; color: #fff; font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Hit Numbers (${hitsFromOriginal.length})</p>
            <div style="display: flex; flex-wrap: wrap; gap: 5px;" id="hits-board"></div>
        </div>
        
        <div style="margin-bottom: 12px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
            <p style="margin: 0 0 6px 0; color: #fff; font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Missed Numbers (${missesFromOriginal.length})</p>
            <div style="display: flex; flex-wrap: wrap; gap: 5px;" id="misses-board"></div>
        </div>
        
        <div style="margin-bottom: 14px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
            <p style="margin: 0 0 6px 0; color: #fff; font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Full Board (1-40)</p>
            <div style="display: grid; grid-template-columns: repeat(8, 1fr); gap: 4px;" id="full-board"></div>
        </div>
    `;

    // Populate hits board
    const hitsBoard = modal.querySelector('#hits-board');
    hitsFromOriginal.forEach(num => {
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

    // Populate misses board
    const missesBoard = modal.querySelector('#misses-board');
    missesFromOriginal.forEach(num => {
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
        const isHit = round.hits.includes(i);
        const wasOriginallySelected = originalSelected.includes(i);
        const isCurrentlySelected = selectedNumbers.includes(i);
        
        let bgColor = '#2f4553';
        let textColor = '#fff';
        let borderStyle = '2px solid #2f4553';
        let boxShadow = 'none';
        
        if (isHit && wasOriginallySelected) {
            // Hit your selection - gem gradient
            bgColor = 'linear-gradient(135deg, #00ff88, #00c853)';
            textColor = '#000';
            borderStyle = '2px solid #00ff88';
            boxShadow = '0 3px 8px rgba(0,200,83,0.4)';
        } else if (wasOriginallySelected && !isHit) {
            // Missed your selection - dark miss color
            bgColor = '#071824';
            textColor = '#ff6b5b';
            borderStyle = '2px solid #ff6b5b';
            boxShadow = '0 3px 8px rgba(255,71,87,0.2)';
        } else if (isHit) {
            // Hit but not your selection - gem accent
            bgColor = 'linear-gradient(135deg, #00c85350, #00a05030)';
            textColor = '#00ff88';
            borderStyle = '2px solid #00c853';
            boxShadow = '0 3px 8px rgba(0,200,83,0.2)';
        }
        
        // Add accent if currently selected (to show where the match came from)
        if (isCurrentlySelected && !wasOriginallySelected) {
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
