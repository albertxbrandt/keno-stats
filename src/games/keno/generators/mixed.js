import { BaseGenerator } from './base.js';

/**
 * Mixed Generator
 * Combines hot and cold numbers
 */
export class MixedGenerator extends BaseGenerator {
  constructor() {
    super('Mixed');
  }

  generate(count, history, config = {}) {
    count = this.validateCount(count);
    const sampleSize = config.sampleSize || 100;
    const sample = this.getSample(history, sampleSize);

    if (sample.length === 0) {
      return this.generateFallback(count);
    }

    const counts = this.countFrequencies(sample);
    const sorted = this.sortByFrequency(counts);

    // Get half hot, half cold
    const hotCount = Math.ceil(count / 2);
    const coldCount = count - hotCount;

    const hot = sorted.slice(0, hotCount).map(entry => entry[0]);
    const cold = sorted.slice(-coldCount).map(entry => entry[0]);

    // Combine and shuffle
    const combined = [...hot, ...cold];
    return combined.sort(() => Math.random() - 0.5).slice(0, count);
  }

  generateFallback(count) {
    const numbers = Array.from({ length: 40 }, (_, i) => i + 1);
    const shuffled = numbers.sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count);
  }
}
