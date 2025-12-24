import { FrequencyGenerator } from './frequency.js';
import { ColdGenerator } from './cold.js';
import { MixedGenerator } from './mixed.js';
import { AverageGenerator } from './average.js';
import { AutoGenerator } from './auto.js';
import { MomentumGenerator } from './momentum.js';
import { ShapesGenerator } from './shapes.js';

/**
 * Factory for creating generator instances
 * Centralizes generator instantiation
 */
export class GeneratorFactory {
  constructor() {
    this.generators = new Map();
    this._registerDefaults();
  }

  /**
   * Register default generators
   * @private
   */
  _registerDefaults() {
    this.register('frequency', new FrequencyGenerator());
    this.register('cold', new ColdGenerator());
    this.register('mixed', new MixedGenerator());
    this.register('average', new AverageGenerator());
    this.register('auto', new AutoGenerator());
    this.register('momentum', new MomentumGenerator());
    this.register('shapes', new ShapesGenerator());
  }

  /**
   * Register a generator
   * @param {string} key - Generator key/id
   * @param {BaseGenerator} generator - Generator instance
   */
  register(key, generator) {
    this.generators.set(key, generator);
  }

  /**
   * Get generator by key
   * @param {string} key
   * @returns {BaseGenerator|null}
   */
  get(key) {
    return this.generators.get(key) || null;
  }

  /**
   * Get all registered generators
   * @returns {Map}
   */
  getAll() {
    return this.generators;
  }

  /**
   * Check if generator exists
   * @param {string} key
   * @returns {boolean}
   */
  has(key) {
    return this.generators.has(key);
  }

  /**
   * Get list of all generator keys
   * @returns {Array<string>}
   */
  getKeys() {
    return Array.from(this.generators.keys());
  }
}

// Export singleton instance
export const generatorFactory = new GeneratorFactory();
