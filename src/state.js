// src/state.js
export const state = {
    currentHistory: [],
    // Heatmap settings
    isHeatmapActive: true,
    heatmapSampleSize: 100, // Heatmap uses separate sample size
    // Unified Number Generator (replaces isPredictMode and isMomentumMode)
    isGeneratorActive: false,
    generatorMethod: 'frequency', // 'frequency' or 'momentum'
    generatorCount: 3, // Unified count for all generator methods
    generatorSampleSize: 5, // Generator uses separate sample size
    generatedNumbers: [],
    generatorAutoSelect: false,
    // Momentum-specific
    momentumLastRefresh: 0,
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
    panelOrder: ['heatmap', 'numberGenerator', 'hitsMiss', 'autoplay', 'profitLoss', 'patternAnalysis', 'recentPlays', 'history']
};
