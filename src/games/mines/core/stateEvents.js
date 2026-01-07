/**
 * Mines State Events System
 * Event-driven reactive updates for Mines tracker
 */

import { EventEmitter } from "@/shared/utils/EventEmitter.js";

// Create singleton instance for Mines
export const stateEvents = new EventEmitter();

// Event names (namespaced for Mines)
export const EVENTS = {
  ROUND_SAVED: "round:saved",
  HISTORY_UPDATED: "history:updated",
};
