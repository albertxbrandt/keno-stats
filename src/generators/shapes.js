import { BaseGenerator } from './base.js';
import { getShapePredictions } from '../shapes.js';

/**
 * Shapes Generator
 * Wrapper for shape pattern placement algorithm
 */
export class ShapesGenerator extends BaseGenerator {
  constructor() {
    super('Shapes');
  }

  generate(count, history, config = {}) {
    count = this.validateCount(count);

    const pattern = config.pattern || 'random';
    const placement = config.placement || 'random';

    const prediction = getShapePredictions(count, pattern, placement, history);

    if (!prediction || prediction.length === 0) {
      return this.generateFallback(count);
    }

    return prediction.slice(0, count);
  }

  generateFallback(count) {
    const numbers = Array.from({ length: 40 }, (_, i) => i + 1);
    const shuffled = numbers.sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count);
  }
}
