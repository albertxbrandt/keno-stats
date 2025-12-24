import { BaseGenerator } from './base.js';
import { getMomentumPrediction } from './momentumCore.js';

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

    // Use sampleSize as detection window, baseline = 4x sampleSize
    const sampleSize = config.sampleSize || 20;
    const momentumConfig = {
      detectionWindow: sampleSize,
      baselineWindow: sampleSize * 4,
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
