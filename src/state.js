// src/state.js
export const state = {
    currentHistory: [],
    sampleSize: 5,
    isPredictMode: false,
    predictedNumbers: [],
    isMomentumMode: false,
    momentumNumbers: [],
    momentumLastRefresh: 0,
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
        sampleSize: true,
        predict: true,
        momentum: true,
        hitsMiss: true,
        autoplay: true,
        profitLoss: true,
        patternAnalysis: true,
        recentPlays: true,
        history: true
    },
    panelOrder: ['sampleSize', 'predict', 'momentum', 'hitsMiss', 'autoplay', 'profitLoss', 'patternAnalysis', 'recentPlays', 'history']
};
