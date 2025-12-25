// src/utils/calculations/profitCalculations.ts
import { COLORS } from '@/shared/constants/colors';

/**
 * Calculate profit/loss from bet data
 * @param betAmount - Amount wagered
 * @param payout - Amount won (including bet)
 * @returns Net profit (payout - bet)
 */
export function calculateProfit(betAmount: number, payout: number): number {
  return payout - betAmount;
}

interface KenoBet {
  amount: number | string;
  payout: number | string;
  currency?: string;
}

interface Bet {
  kenoBet: KenoBet;
  time?: number;
}

interface ProfitData {
  total: number;
  session: number;
}

interface ProfitByCurrency {
  [currency: string]: ProfitData;
}

/**
 * Calculate total profit from all stored bets, grouped by currency
 * @param history - Array of bet objects
 * @param sessionStartTime - Timestamp when session started
 * @returns Profit by currency { btc: { total: 0, session: 0 }, usd: { total: 0, session: 0 }, ... }
 */
export function calculateProfitByCurrency(history: Bet[], sessionStartTime?: number): ProfitByCurrency {
  if (!history || history.length === 0) return {};

  const profitByCurrency: ProfitByCurrency = {};

  history.forEach(bet => {
    if (bet && bet.kenoBet) {
      const amount = parseFloat(bet.kenoBet.amount as string) || 0;
      const payout = parseFloat(bet.kenoBet.payout as string) || 0;
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
 * @param profitByCurrency - Profit data by currency
 * @returns Array of currency codes
 */
export function getAvailableCurrencies(profitByCurrency: ProfitByCurrency): string[] {
  return Object.keys(profitByCurrency).sort();
}

/**
 * Format currency value for display
 * @param value - Value to format
 * @param currency - Currency code
 * @returns Formatted string
 */
export function formatCurrency(value: number, currency: string = 'btc'): string {
  const formatted = Math.abs(value).toFixed(2);
  const currSymbol = currency.toUpperCase();

  if (value > 0) return `+${formatted} ${currSymbol}`;
  if (value < 0) return `-${formatted} ${currSymbol}`;
  return `${formatted} ${currSymbol}`;
}

/**
 * Get color for profit/loss display
 * @param value - Profit/loss value
 * @returns CSS color
 */
export function getProfitColor(value: number): string {
  if (value > 0) return COLORS.accent.success; // Green
  if (value < 0) return COLORS.accent.error; // Red
  return COLORS.text.secondary; // Gray for zero
}
