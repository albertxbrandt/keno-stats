import { BaseGenerator } from './base.js';
import { getMomentumPrediction } from '../momentum.js';

/**
 * Momentum Generator
 * Wrapper for momentum pattern detection algorithm
 */
export class MomentumGenerator extends BaseGenerator {
  constructor() {
    super('Momentum');
  }

  generate(count, history, config = {}) {
    count = this.validateCount(count);

    // Default momentum config
    const momentumConfig = {
      detectionWindow: config.detectionWindow || 10,
      baselineWindow: config.baselineWindow || 50,
      threshold: config.threshold || 1.5,
      poolSize: config.poolSize || 15
    };

    const prediction = getMomentumPrediction(count, momentumConfig);

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
