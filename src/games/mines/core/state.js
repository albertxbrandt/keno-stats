/**
 * Mines game state
 * Centralized state management for Mines tracker
 */

export const state = {
  // UI state
  overlayVisible: false,
  overlayPosition: { x: 20, y: 100 },
  
  // Game state
  currentGame: null,
  gameHistory: [],
  lastRound: null, // Last cashout data
  
  // Interceptor state
  interceptorActive: false,
  
  // Settings
  settings: {
    autoTrack: true,
  },
};
