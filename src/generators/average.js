import { BaseGenerator } from './base.js';

/**
 * Average Generator
 * Returns numbers with frequencies closest to the average/median
 */
export class AverageGenerator extends BaseGenerator {
  constructor() {
    super('Average');
  }

  generate(count, history, config = {}) {
    count = this.validateCount(count);
    const sampleSize = config.sampleSize || 100;
    const sample = this.getSample(history, sampleSize);

    if (sample.length === 0) {
      return this.generateFallback(count);
    }

    const counts = this.countFrequencies(sample);
    const frequencies = Object.values(counts);

    // Calculate median frequency
    const sortedFreqs = [...frequencies].sort((a, b) => a - b);
    const mid = Math.floor(sortedFreqs.length / 2);
    const median = sortedFreqs.length % 2 === 0
      ? (sortedFreqs[mid - 1] + sortedFreqs[mid]) / 2
      : sortedFreqs[mid];

    // Sort numbers by distance to median
    const sorted = Object.entries(counts)
      .map(([num, freq]) => [parseInt(num), Math.abs(freq - median)])
      .sort((a, b) => a[1] - b[1]);

    return sorted.slice(0, count).map(entry => entry[0]);
  }

  generateFallback(count) {
    const numbers = Array.from({ length: 40 }, (_, i) => i + 1);
    const shuffled = numbers.sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count);
  }
}
