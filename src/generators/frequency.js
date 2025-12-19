import { BaseGenerator } from './base.js';

/**
 * Frequency/Hot Numbers Generator
 * Returns most frequently appearing numbers in sample
 */
export class FrequencyGenerator extends BaseGenerator {
  constructor() {
    super('Frequency');
  }

  generate(count, history, config = {}) {
    count = this.validateCount(count);
    const sampleSize = config.sampleSize || 100;
    const sample = this.getSample(history, sampleSize);

    if (sample.length === 0) {
      console.warn('[FrequencyGenerator] No history, using fallback');
      return this.generateFallback(count);
    }

    const counts = this.countFrequencies(sample);
    const sorted = this.sortByFrequency(counts);
    const result = sorted.slice(0, count).map(entry => entry[0]);

    return result;
  }

  generateFallback(count) {
    // Return random numbers when no history available
    const numbers = Array.from({ length: 40 }, (_, i) => i + 1);
    const shuffled = numbers.sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count);
  }
}
