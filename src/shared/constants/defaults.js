// src/ui/constants/defaults.js
// Default values and magic numbers

export const DEFAULTS = {
  // Graph and analysis settings
  lookback: 50,
  lookbackMin: 10,
  riskMode: 'high',
  graphType: 'distribution',

  // Pattern analysis
  patternSampleSize: 200,
  patternTopN: 20,

  // Recent plays
  recentPlaysCount: 5,

  // History storage
  historyChunkSize: 1000,

  // Generator
  generatorCount: 10,
  generatorInterval: 0,
  generatorSampleSize: 20,
  generatorStayIfProfitable: false,

  // Momentum
  momentumDetectionWindow: 5,
  momentumBaselineGames: 20,
  momentumThreshold: 1.3,
  momentumPoolSize: 15
};
