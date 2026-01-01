/**
 * Site-wide state management
 * Stores global state accessible across all modules
 */

export const state = {
  // Current game detection
  currentGame: null, // 'keno', 'dice', 'plinko', or null
  
  // Toolbar state (future sprint)
  toolbarVisible: false,
  toolbarPosition: { x: 20, y: 20 },
  toolbarCollapsed: false,
  
  // Feature states (future sprints)
  coinFlipperActive: false,
  randomGenActive: false,
  magic8BallActive: false,
  
  // Settings
  siteWideSettings: {
    toolbarEnabled: true,
    toolbarAutoCollapse: false,
  },
};
