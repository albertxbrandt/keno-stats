/**
 * Shared Event Emitter
 * Reusable event system for reactive state updates
 */

/**
 * Simple event emitter for state changes
 * Each game/feature can create its own instance to avoid event name conflicts
 */
export class EventEmitter {
  constructor() {
    this.listeners = new Map();
  }

  /**
   * Subscribe to an event
   * @param {string} eventName - Event to listen for
   * @param {Function} callback - Function to call when event fires
   * @returns {Function} Unsubscribe function
   */
  on(eventName, callback) {
    if (!this.listeners.has(eventName)) {
      this.listeners.set(eventName, new Set());
    }
    this.listeners.get(eventName).add(callback);

    // Return unsubscribe function
    return () => {
      const callbacks = this.listeners.get(eventName);
      if (callbacks) {
        callbacks.delete(callback);
      }
    };
  }

  /**
   * Emit an event to all subscribers
   * @param {string} eventName - Event to emit
   * @param {*} data - Data to pass to listeners
   */
  emit(eventName, data) {
    const callbacks = this.listeners.get(eventName);
    if (callbacks) {
      callbacks.forEach((callback) => {
        try {
          callback(data);
        } catch (error) {
          console.error(`[EventEmitter] Error in ${eventName} listener:`, error);
        }
      });
    }
  }

  /**
   * Remove all listeners for an event
   * @param {string} eventName - Event to clear
   */
  clear(eventName) {
    this.listeners.delete(eventName);
  }

  /**
   * Remove all listeners
   */
  clearAll() {
    this.listeners.clear();
  }
}
