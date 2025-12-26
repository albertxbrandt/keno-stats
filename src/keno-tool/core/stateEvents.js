// src/core/stateEvents.js
// Event system for state changes

/**
 * Simple event emitter for state changes
 */
class StateEventEmitter {
  constructor() {
    this.listeners = new Map();
  }

  /**
   * Subscribe to state change events
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
      callbacks.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`[StateEvents] Error in ${eventName} listener:`, error);
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
}

// Create singleton instance
export const stateEvents = new StateEventEmitter();

// Event names
export const EVENTS = {
  HISTORY_UPDATED: 'history:updated',
  GENERATOR_UPDATED: 'generator:updated',
  GENERATOR_PREVIEW_UPDATED: 'generator:preview:updated',
  HEATMAP_UPDATED: 'heatmap:updated',
  ROUND_SAVED: 'round:saved',
  SETTINGS_CHANGED: 'settings:changed',
  PANEL_VISIBILITY_CHANGED: 'panel:visibility:changed',
  PROFIT_UPDATED: 'profit:updated',
};
