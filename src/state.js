// src/state.js
export const state = {
    currentHistory: [],
    sampleSize: 5,
    isPredictMode: false,
    isOverlayVisible: true,
    isAutoPlayMode: false,
    autoPlayRoundsRemaining: 0,
    autoPlayPredictionCount: 3,
    autoPlayStartTime: null,
    autoPlayElapsedTime: 0,
    panelVisibility: {
        sampleSize: true,
        predict: true,
        hitsMiss: true,
        autoplay: true,
        patternAnalysis: true,
        recentPlays: true,
        history: true
    }
};
