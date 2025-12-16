// src/momentum.js - Momentum-based pattern generator
// Detects "hot" numbers by analyzing acceleration above baseline frequency
import { state } from './state.js';
import { getDrawn } from './storage.js';

/**
 * Momentum Pattern Generator
 * Identifies numbers showing acceleration above their baseline frequency
 * and constructs betting patterns from the hottest numbers.
 */
export class MomentumPatternGenerator {
  constructor(config = {}) {
    this.config = {
      patternSize: config.patternSize || 10,
      detectionWindow: config.detectionWindow || 5,
      baselineWindow: config.baselineWindow || 50,
      momentumThreshold: config.momentumThreshold || 1.5,
      refreshFrequency: config.refreshFrequency || 5,
      topNPool: config.topNPool || 15
    };

    this.currentPattern = [];
    this.lastRefreshRound = 0;
  }

  /**
   * Main entry point - call this every round
   * @param {Array} history - Game history array
   * @param {number} currentRoundNumber - Current round number
   * @returns {Array} Pattern of numbers to bet
   */
  getPattern(history, currentRoundNumber) {
    // Check if we need to refresh
    const shouldRefresh =
      this.currentPattern.length === 0 || // First time
      currentRoundNumber % this.config.refreshFrequency === 0; // Time to refresh

    if (shouldRefresh) {
      // Ensure minimum history available
      if (history.length < this.config.baselineWindow) {
        return this.getFallbackPattern(history);
      }

      // Generate new pattern
      this.currentPattern = this.generatePattern(history);
      this.lastRefreshRound = currentRoundNumber;
    }

    return this.currentPattern;
  }

  /**
   * Generate pattern from hot numbers
   * @param {Array} history - Game history
   * @returns {Array} Sorted array of numbers
   */
  generatePattern(history) {
    const hotNumbers = this.identifyHotNumbers(history);
    const topCandidates = hotNumbers.slice(0, this.config.topNPool);

    let pattern = topCandidates
      .slice(0, this.config.patternSize)
      .map(item => item.number);

    // Fill gaps if not enough hot numbers
    if (pattern.length < this.config.patternSize) {
      const fallback = this.getMostFrequentNumbers(
        history,
        this.config.patternSize - pattern.length,
        pattern
      );
      pattern = [...pattern, ...fallback];
    }

    return pattern.sort((a, b) => a - b);
  }

  /**
   * Identify all hot numbers sorted by momentum
   * @param {Array} history - Game history
   * @returns {Array} Array of {number, momentum} objects
   */
  identifyHotNumbers(history) {
    const hotNumbers = [];

    for (let number = 1; number <= 40; number++) {
      const momentum = this.calculateMomentum(number, history);

      if (momentum !== null && momentum >= this.config.momentumThreshold) {
        hotNumbers.push({ number, momentum });
      }
    }

    return hotNumbers.sort((a, b) => b.momentum - a.momentum);
  }

  /**
   * Calculate momentum for a specific number
   * Momentum = (Recent Frequency) / (Baseline Frequency)
   * @param {number} number - Number to analyze (1-40)
   * @param {Array} history - Game history
   * @returns {number|null} Momentum ratio or null if insufficient data
   */
  calculateMomentum(number, history) {
    if (history.length < this.config.baselineWindow) {
      return null;
    }

    const recentRounds = history.slice(-this.config.detectionWindow);
    const baselineRounds = history.slice(-this.config.baselineWindow);

    // Count appearances in recent window
    const recentCount = recentRounds.filter(round => {
      const drawn = getDrawn(round);
      return drawn.includes(number);
    }).length;

    // Count appearances in baseline window
    const baselineCount = baselineRounds.filter(round => {
      const drawn = getDrawn(round);
      return drawn.includes(number);
    }).length;

    // Calculate frequencies
    const recentFreq = recentCount / this.config.detectionWindow;
    const baselineFreq = baselineCount / this.config.baselineWindow;

    // Handle edge case: number never appeared in baseline
    if (baselineFreq === 0) {
      return recentCount > 0 ? 999 : 0;
    }

    // Calculate momentum ratio
    return recentFreq / baselineFreq;
  }

  /**
   * Get most frequent numbers from baseline as fallback
   * @param {Array} history - Game history
   * @param {number} count - How many numbers to return
   * @param {Array} exclude - Numbers to exclude from results
   * @returns {Array} Array of numbers
   */
  getMostFrequentNumbers(history, count, exclude = []) {
    const frequencies = {};
    for (let i = 1; i <= 40; i++) frequencies[i] = 0;

    const baselineRounds = history.slice(-this.config.baselineWindow);
    for (const round of baselineRounds) {
      const drawn = getDrawn(round);
      for (const num of drawn) {
        frequencies[num]++;
      }
    }

    return Object.entries(frequencies)
      .map(([num, freq]) => ({ number: parseInt(num), freq }))
      .filter(item => !exclude.includes(item.number))
      .sort((a, b) => b.freq - a.freq)
      .slice(0, count)
      .map(item => item.number);
  }

  /**
   * Fallback when not enough history
   * @param {Array} history - Game history
   * @returns {Array} Fallback pattern
   */
  getFallbackPattern(history) {
    // Not enough history - use most frequent from what we have
    if (history.length === 0) {
      return this.getRandomPattern();
    }

    return this.getMostFrequentNumbers(history, this.config.patternSize, []);
  }

  /**
   * Generate random pattern as last resort
   * @returns {Array} Random pattern
   */
  getRandomPattern() {
    const numbers = [];
    while (numbers.length < this.config.patternSize) {
      const num = Math.floor(Math.random() * 40) + 1;
      if (!numbers.includes(num)) numbers.push(num);
    }
    return numbers.sort((a, b) => a - b);
  }

  /**
   * Get detailed info about current pattern (for display/debugging)
   * @param {Array} history - Game history
   * @returns {Array} Array of {number, momentum} objects
   */
  getPatternInfo(history) {
    return this.currentPattern.map(number => {
      const momentum = this.calculateMomentum(number, history);
      return {
        number,
        momentum: momentum !== null ? momentum.toFixed(2) : 'N/A'
      };
    });
  }

  /**
   * Get all numbers with their momentum values (for analysis)
   * @param {Array} history - Game history
   * @returns {Array} Array of all 40 numbers with momentum
   */
  getAllMomentumValues(history) {
    const results = [];
    for (let number = 1; number <= 40; number++) {
      const momentum = this.calculateMomentum(number, history);
      results.push({
        number,
        momentum,
        isHot: momentum !== null && momentum >= this.config.momentumThreshold
      });
    }
    return results.sort((a, b) => (b.momentum || 0) - (a.momentum || 0));
  }
}

/**
 * Create a default momentum generator instance
 */
export function createMomentumGenerator(config) {
  return new MomentumPatternGenerator(config);
}

/**
 * Get momentum-based prediction using current history
 * @param {number} count - Pattern size (default 10)
 * @param {object} config - Optional config overrides
 * @returns {Array} Predicted numbers
 */
export function getMomentumPrediction(count = 10, config = {}) {
  const generator = new MomentumPatternGenerator({
    patternSize: count,
    ...config
  });

  const currentRound = state.currentHistory.length;
  return generator.getPattern(state.currentHistory, currentRound);
}

// Expose for console debugging
window.__keno_momentum = {
  createGenerator: createMomentumGenerator,
  getPrediction: getMomentumPrediction
};
