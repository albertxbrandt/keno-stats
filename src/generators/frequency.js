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

    console.log('[FrequencyGenerator] Sample size:', sample.length);
    if (sample.length > 0) {
      console.log('[FrequencyGenerator] First round structure:', sample[0]);
    }

    if (sample.length === 0) {
      console.warn('[FrequencyGenerator] No history, using fallback');
      return this.generateFallback(count);
    }

    const counts = this.countFrequencies(sample);
    console.log('[FrequencyGenerator] Top 10 counts:', Object.entries(counts)
      .map(([num, count]) => [parseInt(num), count])
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10));

    const sorted = this.sortByFrequency(counts);
    const result = sorted.slice(0, count).map(entry => entry[0]);
    console.log('[FrequencyGenerator] Returning:', result);

    return result;
  }

  generateFallback(count) {
    // Return random numbers when no history available
    const numbers = Array.from({ length: 40 }, (_, i) => i + 1);
    const shuffled = numbers.sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count);
  }
}
