// src/utils/calculations/profitCalculations.js

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
 * @param {number} sessionStartTime - Timestamp when session started
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
 * Format currency value for display
 * @param {number} value - Value to format
 * @param {string} currency - Currency code
 * @returns {string} Formatted string
 */
export function formatCurrency(value, currency = 'btc') {
  const formatted = Math.abs(value).toFixed(2);
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
