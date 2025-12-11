// src/profitLoss.js
import { state } from './state.js';

const storageApi = (typeof browser !== 'undefined') ? browser : chrome;

/**
 * Calculate profit/loss from bet data
 * @param {number} betAmount - Amount wagered
 * @param {number} payout - Amount won (including bet)
 * @returns {number} Net profit (payout - bet)
 */
export function calculateProfit(betAmount, payout) {
    return payout - betAmount;
}

/**
 * Calculate total profit from all stored bets, grouped by currency
 * @param {Array} history - Array of bet objects
 * @returns {Object} Profit by currency { btc: { total: 0, session: 0 }, usd: { total: 0, session: 0 }, ... }
 */
export function calculateProfitByCurrency(history, sessionStartTime) {
    if (!history || history.length === 0) return {};
    
    const profitByCurrency = {};
    
    history.forEach(bet => {
        if (bet && bet.kenoBet) {
            const amount = parseFloat(bet.kenoBet.amount) || 0;
            const payout = parseFloat(bet.kenoBet.payout) || 0;
            const currency = (bet.kenoBet.currency?.toLowerCase() || 'btc').toLowerCase();
            const profit = payout - amount;
            const betTime = bet.time || 0;
            
            if (!profitByCurrency[currency]) {
                profitByCurrency[currency] = { total: 0, session: 0 };
            }
            
            profitByCurrency[currency].total += profit;
            
            // Add to session if bet is after session start
            if (sessionStartTime && betTime >= sessionStartTime) {
                profitByCurrency[currency].session += profit;
            }
        }
    });
    
    return profitByCurrency;
}

/**
 * Get list of available currencies from history
 * @param {Object} profitByCurrency - Profit data by currency
 * @returns {Array} Array of currency codes
 */
export function getAvailableCurrencies(profitByCurrency) {
    return Object.keys(profitByCurrency).sort();
}

/**
 * Update session profit for specific currency
 * @param {number} profit - Profit from this round (can be negative)
 * @param {string} currency - Currency code (e.g., 'btc', 'usd')
 */
export function updateSessionProfit(profit, currency = 'btc') {
    const curr = currency.toLowerCase();
    
    if (!state.profitByCurrency[curr]) {
        state.profitByCurrency[curr] = { total: 0, session: 0 };
    }
    
    state.profitByCurrency[curr].session += profit;
    saveSessionProfit();
    
    // Update UI if available
    if (window.__keno_updateProfitLossUI) {
        window.__keno_updateProfitLossUI();
    }
}

/**
 * Recalculate total profit from history
 */
export function recalculateTotalProfit() {
    storageApi.storage.local.get('history').then((res) => {
        const history = res.history || [];
        state.profitByCurrency = calculateProfitByCurrency(history, state.sessionStartTime);
        
        // Update legacy state for selected currency
        const selectedCurr = state.selectedCurrency.toLowerCase();
        if (state.profitByCurrency[selectedCurr]) {
            state.totalProfit = state.profitByCurrency[selectedCurr].total;
            state.sessionProfit = state.profitByCurrency[selectedCurr].session;
        } else {
            state.totalProfit = 0;
            state.sessionProfit = 0;
        }
        
        // Update UI if available
        if (window.__keno_updateProfitLossUI) {
            window.__keno_updateProfitLossUI();
        }
    });
}

/**
 * Load profit/loss data from storage
 */
export function loadProfitLoss() {
    return storageApi.storage.local.get(['history', 'sessionStartTime', 'selectedCurrency']).then((res) => {
        // Load selected currency
        state.selectedCurrency = res.selectedCurrency || 'btc';
        
        // Calculate profit by currency from history
        const history = res.history || [];
        const lastSessionTime = res.sessionStartTime || 0;
        const now = Date.now();
        
        // Reset session if window was closed (no sessionStartTime means fresh start)
        if (!lastSessionTime) {
            state.sessionStartTime = now;
            storageApi.storage.local.set({ sessionStartTime: now });
        } else {
            state.sessionStartTime = lastSessionTime;
        }
        
        // Calculate profits by currency
        state.profitByCurrency = calculateProfitByCurrency(history, state.sessionStartTime);
        
        // Update legacy state for selected currency
        const selectedCurr = state.selectedCurrency.toLowerCase();
        if (state.profitByCurrency[selectedCurr]) {
            state.totalProfit = state.profitByCurrency[selectedCurr].total;
            state.sessionProfit = state.profitByCurrency[selectedCurr].session;
        } else {
            state.totalProfit = 0;
            state.sessionProfit = 0;
        }
        
        // Update UI if available
        if (window.__keno_updateProfitLossUI) {
            window.__keno_updateProfitLossUI();
        }
    });
}

/**
 * Save session profit to storage
 */
export function saveSessionProfit() {
    storageApi.storage.local.set({ 
        sessionStartTime: state.sessionStartTime 
    });
}

/**
 * Reset session profit to zero for selected currency
 */
export function resetSessionProfit() {
    const selectedCurr = state.selectedCurrency.toLowerCase();
    
    if (state.profitByCurrency[selectedCurr]) {
        state.profitByCurrency[selectedCurr].session = 0;
        state.sessionProfit = 0;
    }
    
    state.sessionStartTime = Date.now();
    storageApi.storage.local.set({ 
        sessionStartTime: state.sessionStartTime 
    });
    
    if (window.__keno_updateProfitLossUI) {
        window.__keno_updateProfitLossUI();
    }
}

/**
 * Change selected currency
 * @param {string} currency - Currency code to select
 */
export function changeCurrency(currency) {
    state.selectedCurrency = currency.toLowerCase();
    storageApi.storage.local.set({ selectedCurrency: state.selectedCurrency });
    
    // Update legacy state
    const selectedCurr = state.selectedCurrency.toLowerCase();
    if (state.profitByCurrency[selectedCurr]) {
        state.totalProfit = state.profitByCurrency[selectedCurr].total;
        state.sessionProfit = state.profitByCurrency[selectedCurr].session;
    } else {
        state.totalProfit = 0;
        state.sessionProfit = 0;
    }
    
    if (window.__keno_updateProfitLossUI) {
        window.__keno_updateProfitLossUI();
    }
}

/**
 * Format currency value for display
 * @param {number} value - Value to format
 * @param {string} currency - Currency code
 * @returns {string} Formatted string with color coding
 */
export function formatCurrency(value, currency = 'btc') {
    const formatted = Math.abs(value).toFixed(2); // Round to 2 decimals
    const currSymbol = currency.toUpperCase();
    
    if (value > 0) return `+${formatted} ${currSymbol}`;
    if (value < 0) return `-${formatted} ${currSymbol}`;
    return `${formatted} ${currSymbol}`;
}

/**
 * Get color for profit/loss display
 * @param {number} value - Profit/loss value
 * @returns {string} CSS color
 */
export function getProfitColor(value) {
    if (value > 0) return '#00b894'; // Green
    if (value < 0) return '#ff7675'; // Red
    return '#aaa'; // Gray for zero
}

/**
 * Update profit/loss UI display
 */
export function updateProfitLossUI() {
    const sessionProfitEl = document.getElementById('session-profit-value');
    const totalProfitEl = document.getElementById('total-profit-value');
    const currencySelect = document.getElementById('profit-currency-select');
    
    const selectedCurr = state.selectedCurrency.toLowerCase();
    
    if (sessionProfitEl) {
        sessionProfitEl.textContent = formatCurrency(state.sessionProfit, selectedCurr);
        sessionProfitEl.style.color = getProfitColor(state.sessionProfit);
    }
    
    if (totalProfitEl) {
        totalProfitEl.textContent = formatCurrency(state.totalProfit, selectedCurr);
        totalProfitEl.style.color = getProfitColor(state.totalProfit);
    }
    
    // Update currency dropdown
    if (currencySelect) {
        // Populate currency options from available currencies
        const currencies = getAvailableCurrencies(state.profitByCurrency);
        
        if (currencies.length > 0) {
            const currentValue = currencySelect.value;
            currencySelect.innerHTML = '';
            
            currencies.forEach(curr => {
                const option = document.createElement('option');
                option.value = curr;
                option.textContent = curr.toUpperCase();
                currencySelect.appendChild(option);
            });
            
            // Set selected currency
            if (currencies.includes(selectedCurr)) {
                currencySelect.value = selectedCurr;
            } else if (currencies.length > 0) {
                currencySelect.value = currencies[0];
                changeCurrency(currencies[0]);
            }
        }
    }
}

// Expose to window for cross-module access
window.__keno_updateProfitLossUI = updateProfitLossUI;
window.__keno_resetSessionProfit = resetSessionProfit;
window.__keno_recalculateTotalProfit = recalculateTotalProfit;
window.__keno_changeCurrency = changeCurrency;
window.__keno_updateProfit = (profit, currency) => {
    updateSessionProfit(profit, currency);
};
