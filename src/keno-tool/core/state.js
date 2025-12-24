// src/state.js
export const state = {
    currentHistory: [],
    recentPlays: [], // Last 5 unique selected number combinations
    // Tracker state (hits/misses from last round)
    trackerHits: '-',
    trackerMisses: '-',
    // Heatmap settings
    isHeatmapActive: true,
    heatmapMode: 'hot', // 'hot' = frequency-based, 'trending' = momentum-based
    heatmapSampleSize: 100, // Heatmap uses separate sample size
    // Unified Number Generator (replaces isPredictMode and isMomentumMode)
    generatorMethod: 'frequency', // 'frequency', 'momentum', or 'cold'
    generatorCount: 3, // Unified count for all generator methods
    generatorSampleSize: 20, // Universal sample size for all generators
    generatedNumbers: [],
    nextNumbers: [], // Preview numbers shown to user (updates every round)
    generatorAutoRefresh: true, // Auto-refresh toggle (on by default)
    generatorInterval: 5, // Auto-refresh interval in rounds (min 1)
    generatorLastRefresh: 0, // Universal last refresh round counter
    generatorActuallyRefreshed: false, // Track if generator was actually refreshed vs cached
    lastGeneratedPredictions: null, // Store predictions for comparison tracking
    // Momentum-specific
    momentumLastRefresh: 0,
    momentumActuallyRefreshed: false, // Track if momentum was actually regenerated vs cached
    momentumDisplayCache: null, // Cache momentum display to avoid recalculating
    // Legacy support (will be deprecated)
    sampleSize: 5, // Legacy
    // Legacy support (will be deprecated)
    isPredictMode: false,
    predictedNumbers: [],
    isMomentumMode: false,
    momentumNumbers: [],
    momentumAutoSelect: false,
    isOverlayVisible: true,
    isAutoPlayMode: false,
    autoPlayRoundsRemaining: 0,
    autoPlayPredictionCount: 3,
    autoPlayStartTime: null,
    autoPlayElapsedTime: 0,
    sessionStartTime: Date.now(),
    totalProfit: 0,
    sessionProfit: 0,
    selectedCurrency: 'btc', // Default currency for display
    profitByCurrency: {}, // { btc: { total: 0, session: 0 }, usd: { total: 0, session: 0 }, ... }
    panelVisibility: {
        heatmap: true,
        numberGenerator: true,
        sampleSize: true, // Legacy
        predict: true, // Legacy
        momentum: true, // Legacy
        hitsMiss: true,
        autoplay: true,
        profitLoss: true,
        patternAnalysis: true,
        recentPlays: true,
        history: true
    },
    panelOrder: ['heatmap', 'numberGenerator', 'hitsMiss', 'autoplay', 'profitLoss', 'patternAnalysis', 'recentPlays', 'history'],
    // Method Comparison Window
    isComparisonWindowOpen: false,
    comparisonLookback: 50, // How many rounds to track
    comparisonData: [], // Array of {round, frequency: {predicted, hits, profit}, momentum: {predicted, hits, profit}, cold: {predicted, hits, profit}}
    gameDifficulty: 'classic', // Current game difficulty (classic, low, medium, high)
    // Shapes Generator Config
    shapesPattern: 'random', // Selected shape pattern ('random', 'smart', or specific shape key)
    shapesPlacement: 'random', // Placement strategy ('random', 'hot', 'trending')
    shapesInterval: 0, // Auto-refresh interval in rounds (0 = manual)
    shapesLastRefresh: 0, // Last round number when shapes was refreshed
    shapesActuallyRefreshed: false, // Track if shapes was actually regenerated vs cached
    shapesUsageHistory: [] // Array of recently used shape keys (for weighted random)
};
