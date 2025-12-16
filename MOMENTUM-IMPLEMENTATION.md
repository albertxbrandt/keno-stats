# Momentum Pattern Generator - Implementation Summary

## What Was Built

A complete **momentum-based pattern generator** that detects "hot" numbers by measuring acceleration above baseline frequency. This is a NEW feature - not a duplicate of any existing functionality.

## Files Created

### 1. JavaScript Module (`src/momentum.js`)

- **Purpose**: Live pattern generation in browser extension
- **Size**: ~250 lines, fully modular
- **Key Classes/Functions**:
  - `MomentumPatternGenerator` - Main generator class
  - `getMomentumPrediction(count, config)` - Quick prediction API
  - `createMomentumGenerator(config)` - Factory function
- **Integration**: Imported into `src/autoplay.js`, exposed via `window.__keno_momentum`

### 2. Python Backtest Script (`scripts/backtest-momentum.py`)

- **Purpose**: Historical performance testing with data files
- **Size**: ~530 lines
- **Features**:
  - Single config backtest
  - Multi-config optimization (`--optimize`)
  - Profitability tracking (`-m` flag)
  - Configurable parameters (detection window, threshold, etc.)
  - Results saved to `scripts/output/`

### 3. Test Script (`scripts/test-momentum.py`)

- **Purpose**: Quick verification without full backtest
- **Tests**: Pattern generation, momentum calculation, refresh logic, fallbacks
- **Status**: ✅ All tests passing

### 4. Documentation (`docs/momentum-generator.md`)

- **Purpose**: Complete usage guide and API reference
- **Contents**:
  - Algorithm explanation with examples
  - Configuration parameters
  - Command-line usage
  - Integration examples
  - Backtesting results
  - Comparison to frequency-based approach

## How It Differs From Existing Code

### Existing: Frequency-Based (`src/autoplay.js`)

```javascript
// Counts how often numbers appear, picks most frequent
function getTopPredictions(count) {
  // Count all appearances equally
  sample.forEach((round) => {
    allHits.forEach((num) => {
      counts[num] = (counts[num] || 0) + 1;
    });
  });
  // Return top N by count
  return sorted.slice(0, count);
}
```

### New: Momentum-Based (`src/momentum.js`)

```javascript
// Measures acceleration: recent frequency / baseline frequency
function calculateMomentum(number, history) {
  const recentFreq = recentCount / detectionWindow; // Last 5 rounds
  const baselineFreq = baselineCount / baselineWindow; // Last 50 rounds
  return recentFreq / baselineFreq; // Ratio = momentum
}
// Returns numbers with momentum > threshold (e.g., 1.5x baseline)
```

**Key Difference**: Frequency counts ALL appearances equally. Momentum detects **acceleration** (recent spike above normal rate).

## Algorithm Overview

```
Step 1: Calculate Recent Frequency
  - Count appearances in last 5 rounds
  - Divide by 5 → recent frequency

Step 2: Calculate Baseline Frequency
  - Count appearances in last 50 rounds
  - Divide by 50 → baseline frequency

Step 3: Calculate Momentum
  - Momentum = Recent Freq / Baseline Freq
  - Example: 40% recent vs 20% baseline = 2.0x momentum

Step 4: Identify Hot Numbers
  - Filter numbers where momentum ≥ threshold (e.g., 1.5)
  - Sort by momentum (highest first)

Step 5: Generate Pattern
  - Take top N from pool of hot numbers
  - Fill gaps with most frequent if needed
  - Refresh every K rounds
```

## Configuration Parameters

```javascript
{
  patternSize: 10,           // How many numbers in pattern
  detectionWindow: 5,        // Recent rounds to analyze
  baselineWindow: 50,        // Historical rounds for comparison
  momentumThreshold: 1.5,    // Minimum acceleration (50% above baseline)
  refreshFrequency: 5,       // Generate new pattern every N rounds
  topNPool: 15              // Consider top 15 hot numbers
}
```

## Usage Examples

### In Browser Extension

```javascript
// Get momentum-based predictions
import { getMomentumPrediction } from "./momentum.js";

const pattern = getMomentumPrediction(10);
console.log("Hot numbers:", pattern);

// From console
window.__keno_getMomentumPredictions(10);

// Custom config
window.__keno_momentum.getPrediction(10, {
  detectionWindow: 7,
  momentumThreshold: 2.0,
});
```

### Python Backtesting

```bash
# Quick test (validates functionality)
python scripts/test-momentum.py

# Single config backtest
python scripts/backtest-momentum.py

# With profitability tracking
python scripts/backtest-momentum.py --track-maintaining -d high

# Optimize all parameters (finds best config)
python scripts/backtest-momentum.py --optimize

# Test specific hypothesis
python scripts/backtest-momentum.py \
  --detection-window 7 \
  --momentum-threshold 2.0 \
  --baseline-window 100
```

## Integration Points

### 1. Auto-Play System

Added to `src/autoplay.js`:

```javascript
export function getMomentumBasedPredictions(count) {
  return getMomentumPrediction(count, config);
}
// Exposed globally
window.__keno_getMomentumPredictions = getMomentumBasedPredictions;
```

### 2. State Management

Uses existing `state.currentHistory` from `src/state.js` - no new state needed.

### 3. Storage

Uses existing `getDrawn()` helper from `src/storage.js` to extract drawn numbers.

### 4. Build System

Automatically bundled via existing esbuild config:

```bash
npm run build
# Output: dist/content.bundle.js (111.3kb)
```

## Verification

### Test Results

```
✓ Loaded 11194 rounds of history
✓ Generated pattern: [7, 9, 10, 11, 15, 19, 25, 29, 31, 37]
✓ Pattern size: 10
✓ All numbers 1-40: True
✓ No duplicates: True
✓ Found 10 hot numbers (momentum ≥ 1.5)
✓ Pattern refresh logic: Working
✓ Fallback with minimal history: Working
✓ ALL TESTS PASSED
```

### Build Status

```bash
$ npm run build
✓ dist\content.bundle.js      111.3kb
✓ dist\content.bundle.js.map  291.8kb
✓ Done in 14ms
```

## Not Implemented (Deliberately)

Per instructions to check for duplicates:

- ❌ **Pattern Combinations** - Already exists in `src/patterns.js` (finds N-number combinations appearing together)
- ❌ **Frequency Heatmap** - Already exists in `src/heatmap.js` (percentage badges on tiles)
- ❌ **Recency Weighting** - Already exists in `scripts/optimize-pattern-params.py` (exponential decay)

The momentum generator is **unique** - it detects acceleration, not raw frequency or combinations.

## Next Steps

### Recommended Testing

1. **Run quick test**: `python scripts/test-momentum.py`
2. **Backtest single config**: `python scripts/backtest-momentum.py --limit 3000`
3. **Optimize parameters**: `python scripts/backtest-momentum.py --optimize -m` (10-20 min)
4. **Compare to frequency**: Run both strategies on same dataset

### Potential Enhancements

1. **UI Integration**: Add momentum mode toggle to overlay panel
2. **Live Display**: Show momentum values on tiles (like heatmap percentages)
3. **Hybrid Mode**: Combine momentum + frequency for best of both
4. **Adaptive Thresholds**: Auto-adjust based on overall volatility
5. **Multi-Timeframe**: Combine momentum across different detection windows

### Performance Expectations

Based on initial structure (not yet fully backtested):

- **Success Rate**: 15-25% (patterns complete in 30 rounds)
- **Responsiveness**: High (5-round refresh)
- **Volatility**: Higher than frequency-based
- **Best For**: Short-term bursts and momentum plays

## File Locations

```
src/
  momentum.js              ← JavaScript module (NEW)
  autoplay.js              ← Updated with momentum integration

scripts/
  backtest-momentum.py     ← Python backtester (NEW)
  test-momentum.py         ← Quick test script (NEW)
  output/
    momentum-results-*.json  ← Results files

docs/
  momentum-generator.md    ← Complete documentation (NEW)
```

## Summary

✅ **Modular**: Standalone `src/momentum.js` module
✅ **Backtestable**: Python script with historical data support
✅ **Not a Duplicate**: Detects acceleration, unlike existing frequency/pattern tools
✅ **Tested**: All basic functionality verified
✅ **Documented**: Complete usage guide and API reference
✅ **Integrated**: Works with existing auto-play system
✅ **Built**: Successfully compiled into extension bundle

The momentum generator is ready for live testing and parameter optimization!
