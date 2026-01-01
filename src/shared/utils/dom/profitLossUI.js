// src/utils/dom/profitLossUI.js
import { state } from '@/games/keno/core/state.js';
import {
  getAvailableCurrencies,
  formatCurrency,
  getProfitColor
} from '../calculations/profitCalculations.js';
import { changeCurrency } from '../../storage/profitLoss.js';

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
