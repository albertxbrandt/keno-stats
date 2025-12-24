// src/storage/profitLoss.js
import { state } from '@/keno-tool/core/state.js';
import { stateEvents, EVENTS } from '@/keno-tool/core/stateEvents.js';
import { calculateProfitByCurrency } from '../utils/calculations/profitCalculations.js';

const storageApi = (typeof browser !== 'undefined') ? browser : chrome;

/**
 * Load profit/loss data from storage
 */
export function loadProfitLoss() {
  return storageApi.storage.local.get(['sessionStartTime', 'selectedCurrency']).then((res) => {
    // Calculate profit by currency from history (use state.currentHistory, already loaded)
    const history = state.currentHistory || [];
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

    // Get available currencies from history
    const availableCurrencies = Object.keys(state.profitByCurrency);

    // Set selected currency: use saved preference, or first available currency from history, or null if no data
    if (res.selectedCurrency && availableCurrencies.includes(res.selectedCurrency)) {
      state.selectedCurrency = res.selectedCurrency;
    } else if (availableCurrencies.length > 0) {
      state.selectedCurrency = availableCurrencies[0];
    } else {
      state.selectedCurrency = null;
    }

    // Update legacy state for selected currency
    if (state.selectedCurrency) {
      const selectedCurr = state.selectedCurrency.toLowerCase();
      if (state.profitByCurrency[selectedCurr]) {
        state.totalProfit = state.profitByCurrency[selectedCurr].total;
        state.sessionProfit = state.profitByCurrency[selectedCurr].session;
      } else {
        state.totalProfit = 0;
        state.sessionProfit = 0;
      }

      // Emit event so components can initialize
      stateEvents.emit(EVENTS.PROFIT_UPDATED, {
        currency: selectedCurr,
        sessionProfit: state.sessionProfit,
        totalProfit: state.totalProfit
      });
    } else {
      // No data - set to zeros
      state.totalProfit = 0;
      state.sessionProfit = 0;
      
      // Still emit event so UI updates
      stateEvents.emit(EVENTS.PROFIT_UPDATED, {
        currency: null,
        sessionProfit: 0,
        totalProfit: 0
      });
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
export function updateSessionProfit(profit, currency) {
  const curr = currency.toLowerCase();

  if (!state.profitByCurrency[curr]) {
    state.profitByCurrency[curr] = { total: 0, session: 0 };
  }

  // Increment both session AND total profit (optimization: no need to recalculate from entire history)
  state.profitByCurrency[curr].session += profit;
  state.profitByCurrency[curr].total += profit;

  // Update selectedCurrency to match the bet that just completed
  state.selectedCurrency = curr;

  // Update legacy state
  state.totalProfit = state.profitByCurrency[curr].total;
  state.sessionProfit = state.profitByCurrency[curr].session;

  saveSessionProfit();

  // Emit event for listeners
  stateEvents.emit(EVENTS.PROFIT_UPDATED, {
    currency: curr,
    sessionProfit: state.profitByCurrency[curr].session,
    totalProfit: state.profitByCurrency[curr].total
  });

  // Update UI if available
  if (window.__keno_updateProfitLossUI) {
    window.__keno_updateProfitLossUI();
  }
}

/**
 * Recalculate total profit from history
 */
export function recalculateTotalProfit() {
  // Use in-memory history (already up-to-date), not storage (may be stale during writes)
  const history = state.currentHistory || [];
  state.profitByCurrency = calculateProfitByCurrency(history, state.sessionStartTime);

  // Update legacy state
  const selectedCurr = state.selectedCurrency.toLowerCase();
  if (state.profitByCurrency[selectedCurr]) {
    state.totalProfit = state.profitByCurrency[selectedCurr].total;
    state.sessionProfit = state.profitByCurrency[selectedCurr].session;
  }

  // Emit event for listeners
  stateEvents.emit(EVENTS.PROFIT_UPDATED, {
    currency: selectedCurr,
    sessionProfit: state.sessionProfit,
    totalProfit: state.totalProfit
  });

  if (window.__keno_updateProfitLossUI) {
    window.__keno_updateProfitLossUI();
  }
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

  // Emit event for listeners
  stateEvents.emit(EVENTS.PROFIT_UPDATED, {
    currency: selectedCurr,
    sessionProfit: 0,
    totalProfit: state.totalProfit
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

  // Emit event for listeners
  stateEvents.emit(EVENTS.PROFIT_UPDATED, {
    currency: selectedCurr,
    sessionProfit: state.sessionProfit,
    totalProfit: state.totalProfit
  });

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
