import { BaseGenerator } from './base.js';

/**
 * Auto Generator
 * Analyzes comparison data and selects the best performing method
 */
export class AutoGenerator extends BaseGenerator {
  constructor() {
    super('Auto');
  }

  generate(count, history, config = {}) {
    count = this.validateCount(count);
    const comparison = config.comparison || [];

    if (comparison.length === 0 || history.length === 0) {
      return this.generateFallback(count);
    }

    // Analyze last 20 rounds to find best performing method
    const recentComparison = comparison.slice(-20);
    const methodScores = {};

    for (const round of recentComparison) {
      if (!round || !round.hits) continue;

      for (const [method, data] of Object.entries(round)) {
        if (method === 'hits' || !data || typeof data.accuracy !== 'number') continue;

        if (!methodScores[method]) {
          methodScores[method] = { total: 0, count: 0 };
        }

        methodScores[method].total += data.accuracy;
        methodScores[method].count++;
      }
    }

    // Find method with highest average accuracy
    let bestMethod = null;
    let bestScore = -1;

    for (const [method, score] of Object.entries(methodScores)) {
      if (score.count === 0) continue;
      const avgScore = score.total / score.count;
      if (avgScore > bestScore) {
        bestScore = avgScore;
        bestMethod = method;
      }
    }

    // If we found a best method, return its latest predictions
    if (bestMethod && comparison.length > 0) {
      const latest = comparison[comparison.length - 1];
      if (latest[bestMethod] && latest[bestMethod].predictions) {
        return latest[bestMethod].predictions.slice(0, count);
      }
    }

    return this.generateFallback(count);
  }

  generateFallback(count) {
    const numbers = Array.from({ length: 40 }, (_, i) => i + 1);
    const shuffled = numbers.sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count);
  }
}
