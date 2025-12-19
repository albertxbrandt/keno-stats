/**
 * Base class for all number generators
 * Each generator must implement the generate() method
 * 
 * @abstract
 */
export class BaseGenerator {
  constructor(name) {
    if (this.constructor === BaseGenerator) {
      throw new Error("BaseGenerator is abstract and cannot be instantiated directly");
    }
    this.name = name;
  }

  /**
   * Generate predictions based on history
   * @param {number} count - Number of predictions to generate
   * @param {Array} history - Game history
   * @param {Object} config - Optional configuration
   * @returns {Array<number>} Array of predicted numbers (1-40)
   * @abstract
   */
  generate(count, history, config = {}) {
    throw new Error("generate() must be implemented by subclass");
  }

  /**
   * Get display name for UI
   * @returns {string}
   */
  getName() {
    return this.name;
  }

  /**
   * Validate count is within acceptable range
   * @param {number} count
   * @returns {number} Clamped count
   */
  validateCount(count) {
    return Math.max(1, Math.min(40, Math.floor(count)));
  }

  /**
   * Get sample from history based on sample size
   * @param {Array} history
   * @param {number} sampleSize
   * @returns {Array}
   */
  getSample(history, sampleSize) {
    if (!history || history.length === 0) return [];
    return history.slice(-sampleSize);
  }

  /**
   * Count number frequencies in sample
   * @param {Array} sample
   * @returns {Object} Map of number -> count
   */
  countFrequencies(sample) {
    const counts = {};
    for (let i = 1; i <= 40; i++) {
      counts[i] = 0;
    }

    for (const round of sample) {
      // Extract drawn numbers from various possible data structures
      let numbers = [];

      // New format: round.kenoBet.state.drawnNumbers
      if (round.kenoBet && round.kenoBet.state && round.kenoBet.state.drawnNumbers) {
        numbers = round.kenoBet.state.drawnNumbers;
      }
      // Legacy format: round.drawn
      else if (round.drawn) {
        numbers = round.drawn;
      }

      for (const num of numbers) {
        if (counts[num] !== undefined) {
          counts[num]++;
        }
      }
    }

    return counts;
  }

  /**
   * Sort numbers by frequency (descending)
   * @param {Object} counts
   * @returns {Array<[number, number]>} [[num, count], ...]
   */
  sortByFrequency(counts) {
    return Object.entries(counts)
      .map(([num, count]) => [parseInt(num), count])
      .sort((a, b) => b[1] - a[1]);
  }
}
