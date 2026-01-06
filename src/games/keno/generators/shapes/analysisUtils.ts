// src/games/keno/generators/shapes/analysisUtils.ts
// Frequency and momentum analysis utilities for placement strategies

/**
 * Game history round (normalized format)
 */
export interface HistoryRound {
  kenoBet?: {
    state?: {
      drawnNumbers?: number[];
    };
  };
  drawn?: number[];
}

/**
 * Frequency map: number (1-40) -> occurrence count
 */
export type FrequencyMap = Record<number, number>;

/**
 * Momentum map: number (1-40) -> trending ratio
 */
export type MomentumMap = Record<number, number>;

/**
 * Calculate frequency map for all numbers 1-40
 * @param historyData - Game history
 * @param sampleSize - Number of recent rounds to analyze
 * @returns Frequency count for each number
 */
export function calculateFrequency(historyData: HistoryRound[], sampleSize: number): FrequencyMap {
  const frequency: FrequencyMap = {};
  for (let i = 1; i <= 40; i++) {
    frequency[i] = 0;
  }

  const recentHistory = historyData.slice(-sampleSize);
  recentHistory.forEach(round => {
    const drawn = round.kenoBet?.state?.drawnNumbers || round.drawn || [];
    drawn.forEach(num => {
      if (frequency[num] !== undefined) frequency[num]++;
    });
  });

  return frequency;
}

/**
 * Calculate momentum (trending) map for all numbers 1-40
 * Returns ratio of recent frequency to baseline frequency
 * 
 * @param historyData - Game history
 * @param sampleSize - Recent window size (baseline = 4x this)
 * @returns Momentum ratio for each number (>1 = trending up)
 */
export function calculateMomentum(historyData: HistoryRound[], sampleSize: number): MomentumMap {
  const minHistory = sampleSize * 5;
  if (historyData.length < minHistory) {
    // Not enough history, return neutral momentum
    const neutral: MomentumMap = {};
    for (let i = 1; i <= 40; i++) {
      neutral[i] = 1.0;
    }
    return neutral;
  }

  const recentWindow = sampleSize;
  const baselineWindow = sampleSize * 4;

  const recent = historyData.slice(-recentWindow);
  const baseline = historyData.slice(-(recentWindow + baselineWindow), -recentWindow);

  const recentFreq: FrequencyMap = {};
  const baselineFreq: FrequencyMap = {};

  for (let i = 1; i <= 40; i++) {
    recentFreq[i] = 0;
    baselineFreq[i] = 0;
  }

  recent.forEach(round => {
    const drawn = round.kenoBet?.state?.drawnNumbers || round.drawn || [];
    drawn.forEach(num => {
      if (recentFreq[num] !== undefined) recentFreq[num]++;
    });
  });

  baseline.forEach(round => {
    const drawn = round.kenoBet?.state?.drawnNumbers || round.drawn || [];
    drawn.forEach(num => {
      if (baselineFreq[num] !== undefined) baselineFreq[num]++;
    });
  });

  // Calculate momentum ratios
  const momentum: MomentumMap = {};
  for (let i = 1; i <= 40; i++) {
    const recentRate = recentFreq[i]! / recentWindow;
    const baselineRate = baselineFreq[i]! / baselineWindow;
    momentum[i] = baselineRate > 0 ? recentRate / baselineRate : 1.0;
  }

  return momentum;
}
