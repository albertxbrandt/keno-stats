import { BaseGenerator } from './base.js';

/**
 * Random Generator
 * Generates completely random number selections
 */
export class RandomGenerator extends BaseGenerator {
  constructor() {
    super('Random');
  }

  generate(count) {
    count = this.validateCount(count);

    // Create array of all numbers 1-40
    const numbers = Array.from({ length: 40 }, (_, i) => i + 1);

    // Shuffle using Fisher-Yates algorithm
    for (let i = numbers.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [numbers[i], numbers[j]] = [numbers[j], numbers[i]];
    }

    // Return first N numbers
    return numbers.slice(0, count);
  }
}
