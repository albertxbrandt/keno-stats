// src/games/mines/core/storage.ts
// Mines history storage management

import type { MinesRoundData, MinesCashoutResponse } from "@/shared/types/api";

// Global declarations for browser extension APIs
declare const browser: typeof chrome | undefined;
declare const chrome: {
  storage: {
    local: {
      get: (keys: string | string[]) => Promise<Record<string, unknown>>;
      set: (items: Record<string, unknown>) => Promise<void>;
      remove: (keys: string | string[]) => Promise<void>;
    };
  };
};

const STORAGE_KEY = "minesHistory";

/**
 * Get all Mines history from storage
 */
export async function getMinesHistory(): Promise<MinesRoundData[]> {
  const storageApi = typeof browser !== "undefined" ? browser : chrome;
  const result = await storageApi.storage.local.get(STORAGE_KEY);
  return (result[STORAGE_KEY] as MinesRoundData[]) || [];
}

/**
 * Save a Mines round to history
 * @param cashoutData - Raw cashout data from API
 */
export async function saveMinesRound(
  cashoutData: MinesCashoutResponse
): Promise<void> {
  const history = await getMinesHistory();

  // Calculate derived values
  const revealedCount = cashoutData.state.rounds.length;
  const finalMultiplier = cashoutData.payoutMultiplier;
  const won = cashoutData.payout > 0; // If they got a payout, they cashed out successfully

  const roundData: MinesRoundData = {
    id: cashoutData.id,
    minesCashout: cashoutData,
    time: Date.now(),
    revealedCount,
    finalMultiplier,
    won,
  };

  // Add to history (most recent first)
  history.unshift(roundData);

  // Save to storage
  const storageApi = typeof browser !== "undefined" ? browser : chrome;
  await storageApi.storage.local.set({ [STORAGE_KEY]: history });
}

/**
 * Clear all Mines history
 */
export async function clearMinesHistory(): Promise<void> {
  const storageApi = typeof browser !== "undefined" ? browser : chrome;
  await storageApi.storage.local.remove(STORAGE_KEY);
}

/**
 * Get Mines statistics from history
 */
export async function getMinesStats() {
  const history = await getMinesHistory();

  if (history.length === 0) {
    return {
      totalGames: 0,
      wins: 0,
      losses: 0,
      winRate: 0,
      avgRevealedTiles: 0,
      avgMultiplier: 0,
    };
  }

  const wins = history.filter((r) => r.won).length;
  const losses = history.length - wins;
  const winRate = (wins / history.length) * 100;

  const totalRevealed = history.reduce((sum, r) => sum + r.revealedCount, 0);
  const avgRevealedTiles = totalRevealed / history.length;

  const totalMultiplier = history.reduce(
    (sum, r) => sum + r.finalMultiplier,
    0
  );
  const avgMultiplier = totalMultiplier / history.length;

  return {
    totalGames: history.length,
    wins,
    losses,
    winRate: Math.round(winRate * 10) / 10,
    avgRevealedTiles: Math.round(avgRevealedTiles * 10) / 10,
    avgMultiplier: Math.round(avgMultiplier * 100) / 100,
  };
}
