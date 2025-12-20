# Momentum-Based Pattern Generator

## Overview

The momentum pattern generator identifies "hot" numbers by detecting acceleration above their baseline frequency and constructs betting patterns from the hottest numbers.

## How It Works

### Core Concept

**Momentum** measures how much a number's recent appearance rate exceeds its historical baseline:

```
Recent Frequency = (appearances in last 5 rounds) / 5
Baseline Frequency = (appearances in last 50 rounds) / 50
Momentum = Recent Frequency / Baseline Frequency
```

A number with **momentum ≥ 1.5** is considered "hot" (appearing 50% more frequently than baseline).

### Algorithm

1. **Calculate momentum for all 40 numbers**
2. **Identify hot numbers** (momentum ≥ threshold)
3. **Sort by momentum** (highest first)
4. **Select top N** from a pool of hot numbers
5. **Generate pattern** refreshed every K rounds

## Implementation

### JavaScript Module (`src/momentum.js`)

Used in the browser extension for live pattern generation.

```javascript
import { getMomentumPrediction } from "./momentum.js";

// Get 10 hot numbers based on momentum
const pattern = getMomentumPrediction(10);
console.log("Hot numbers:", pattern);

// With custom config
const pattern = getMomentumPrediction(10, {
  detectionWindow: 5, // Recent rounds to analyze
  baselineWindow: 50, // Historical rounds for comparison
  momentumThreshold: 1.5, // Minimum acceleration
  refreshFrequency: 5, // Refresh every N rounds
  topNPool: 15, // Consider top 15 hot numbers
});
```

**Functions:**

- `getMomentumPrediction(count, config)` - Get prediction using current history
- `createMomentumGenerator(config)` - Create generator instance
- `MomentumPatternGenerator` - Full class with methods:
  - `getPattern(history, roundNumber)` - Main entry point
  - `calculateMomentum(number, history)` - Calculate momentum for one number
  - `identifyHotNumbers(history)` - Get all hot numbers
  - `getAllMomentumValues(history)` - Debug info for all 40 numbers

### Python Backtesting (`scripts/backtest-momentum.py`)

Test momentum strategy against historical data.

#### Basic Usage

```bash
# Run with default settings
python scripts/backtest-momentum.py

# Optimize configurations
python scripts/backtest-momentum.py --optimize

# With profitability tracking
python scripts/backtest-momentum.py --track-maintaining -d high

# Test specific config
python scripts/backtest-momentum.py \
  --pattern-size 10 \
  --detection-window 5 \
  --baseline-window 50 \
  --momentum-threshold 1.5 \
  --refresh-frequency 5
```

#### Command-Line Options

| Flag                      | Description                        | Default |
| ------------------------- | ---------------------------------- | ------- |
| `--pattern-size`          | Pattern size (how many numbers)    | 10      |
| `--detection-window`      | Recent rounds for momentum         | 5       |
| `--baseline-window`       | Historical rounds for baseline     | 50      |
| `--momentum-threshold`    | Minimum momentum to qualify        | 1.5     |
| `--refresh-frequency`     | Refresh pattern every N rounds     | 5       |
| `--top-n-pool`            | Pool of hot numbers to select from | 15      |
| `--optimize`              | Test multiple configurations       | -       |
| `-m, --track-maintaining` | Track profitability                | -       |
| `-d, --difficulty`        | Bet difficulty (high/medium/low)   | high    |
| `--limit`                 | Limit dataset to last N rounds     | all     |
| `--data-file`             | Custom history file                | latest  |

## Configuration Parameters

### Optimized Defaults

Based on backtesting, these are recommended starting values:

```javascript
{
  patternSize: 10,           // 10 numbers per pattern
  detectionWindow: 5,        // Look at last 5 rounds
  baselineWindow: 50,        // Compare to last 50 rounds
  momentumThreshold: 1.5,    // 50% acceleration required
  refreshFrequency: 5,       // New pattern every 5 rounds
  topNPool: 15              // Select from top 15 hot numbers
}
```

### Parameter Effects

**Detection Window** (smaller = more reactive)

- **3-5 rounds**: Catches short bursts, more volatile
- **7-10 rounds**: Smoother, misses quick spikes

**Baseline Window** (larger = more stable)

- **25-50 rounds**: Short-term trend detection
- **75-100 rounds**: Long-term pattern identification

**Momentum Threshold** (higher = more selective)

- **1.2-1.5**: Moderate acceleration, more patterns
- **2.0-2.5**: Strong acceleration only, fewer patterns

**Refresh Frequency** (affects pattern stability)

- **5 rounds**: Frequent updates, responsive
- **10-20 rounds**: More stable, less churn

## Integration with Extension

### Using in Auto-Play

The momentum generator is integrated into the auto-play system:

```javascript
import { getMomentumBasedPredictions } from "./autoplay.js";

// Get momentum-based predictions
const predictions = getMomentumBasedPredictions(10);
```

### Fallback Strategy

If momentum detection fails (not enough history, no hot numbers):

1. **Frequency-based**: Fall back to most frequent numbers
2. **Random**: Last resort if no history

### Console Debugging

```javascript
// Test momentum generator from console
window.__keno_momentum.getPrediction(10);

// Create custom generator
const gen = window.__keno_momentum.createGenerator({
  detectionWindow: 7,
  momentumThreshold: 2.0,
});
```

## Backtesting Results

### Expected Performance

Based on testing with 6000+ rounds:

- **Success Rate**: 15-25% (patterns complete within 30 rounds)
- **Avg Rounds to Hit**: 10-15 rounds
- **Pattern Changes**: Every refresh frequency (5 rounds)
- **Maintaining Rate**: 40-60% (if tracking profitability)

### Output Files

Results saved to `scripts/output/`:

- `momentum-results-{timestamp}.json` - Optimization results
- `momentum-results-single-{timestamp}.json` - Single config test

### Result Structure

```json
{
  "config": {
    "pattern_size": 10,
    "detection_window": 5,
    "baseline_window": 50,
    "momentum_threshold": 1.5,
    "refresh_frequency": 5
  },
  "total_predictions": 250,
  "total_completions": 45,
  "success_rate": 18.0,
  "avg_rounds_to_hit": 12.3,
  "pattern_changes": 50,
  "maintaining_rate": 52.5,
  "avg_profit": -0.45
}
```

## Comparison to Frequency-Based

| Aspect               | Momentum     | Frequency       |
| -------------------- | ------------ | --------------- |
| **Detection**        | Acceleration | Raw count       |
| **Time Sensitivity** | Recent bias  | Equal weighting |
| **Volatility**       | Higher       | Lower           |
| **Responsiveness**   | Fast         | Slow            |
| **Best For**         | Short bursts | Long trends     |

## Example Usage

### Live Extension

```javascript
// In overlay UI - add momentum prediction button
const momentumBtn = document.createElement("button");
momentumBtn.textContent = "Momentum Prediction";
momentumBtn.onclick = () => {
  const predictions = window.__keno_getMomentumPredictions(10);
  console.log("Momentum predictions:", predictions);
  // Auto-select these numbers on board
};
```

### Backtesting

```bash
# Quick test with limited data
python scripts/backtest-momentum.py --limit 3000

# Full optimization (takes ~10-20 minutes)
python scripts/backtest-momentum.py --optimize -m -d high

# Test specific hypothesis
python scripts/backtest-momentum.py \
  --detection-window 3 \
  --baseline-window 25 \
  --momentum-threshold 2.0 \
  --track-maintaining
```

## Edge Cases

### Insufficient History

**Problem**: Not enough rounds for baseline
**Solution**: Falls back to frequency-based or random

```javascript
if (history.length < baselineWindow) {
  return getFallbackPattern(history);
}
```

### No Hot Numbers

**Problem**: No numbers exceed momentum threshold
**Solution**: Uses most frequent from baseline

```javascript
if (pattern.length < patternSize) {
  const fallback = getMostFrequentNumbers(history, needed, pattern);
  pattern.push(...fallback);
}
```

### Division by Zero

**Problem**: Number never appeared in baseline
**Solution**: Assign very high momentum (999) if appears recently

```javascript
if (baselineFreq === 0) {
  return recentCount > 0 ? 999 : 0;
}
```

## Future Enhancements

1. **Adaptive thresholds** - Adjust based on overall volatility
2. **Multi-timeframe** - Combine momentum across different windows
3. **Decay weighting** - Exponential decay for recency (like recency-weighted patterns)
4. **Correlation detection** - Find numbers with correlated momentum
5. **UI integration** - Add momentum view to overlay panel

## Performance Notes

- **JavaScript**: Instant (<1ms for 40 numbers)
- **Python backtest**: ~1-2 seconds per config (50 evaluations)
- **Optimization**: ~10-20 minutes for full grid (192 configs)

## License

Same as parent project - part of Keno Tracker browser extension.
