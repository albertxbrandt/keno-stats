// src/storage/profitLoss.js
import { state } from '../core/state.js';
import { calculateProfitByCurrency } from '../utils/calculations/profitCalculations.js';

const storageApi = (typeof browser !== 'undefined') ? browser : chrome;

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

    // Update legacy state
    const selectedCurr = state.selectedCurrency.toLowerCase();
    if (state.profitByCurrency[selectedCurr]) {
      state.totalProfit = state.profitByCurrency[selectedCurr].total;
      state.sessionProfit = state.profitByCurrency[selectedCurr].session;
    }

    if (window.__keno_updateProfitLossUI) {
      window.__keno_updateProfitLossUI();
    }
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
 * Get session profit for selected currency
 * @returns {number} Session profit
 */
export function getSessionProfit() {
  const selectedCurr = state.selectedCurrency.toLowerCase();
  return state.profitByCurrency[selectedCurr]?.session || 0;
}

/**
 * Get total profit for selected currency
 * @returns {number} Total profit
 */
export function getTotalProfit() {
  const selectedCurr = state.selectedCurrency.toLowerCase();
  return state.profitByCurrency[selectedCurr]?.total || 0;
}
