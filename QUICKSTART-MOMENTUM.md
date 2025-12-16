# Momentum Generator - Quick Start

## What Is It?

A pattern generator that detects "hot" numbers showing **acceleration** above their normal frequency. Unlike simple frequency counting, momentum measures the ratio of recent appearance rate to baseline rate.

**Example**: If a number appears 40% in last 5 rounds but only 20% in last 50 rounds → **2.0x momentum** (hot!)

## Quick Test (30 seconds)

```bash
# Verify installation
python scripts/test-momentum.py

# Expected output:
# ✓ ALL TESTS PASSED
```

## Basic Backtest (2-3 minutes)

```bash
# Test with last 3000 rounds
python scripts/backtest-momentum.py --limit 3000

# Expected output:
# Success Rate: ~15-25%
# Avg Rounds to Hit: ~10-15
```

## Full Optimization (10-20 minutes)

```bash
# Find best configuration
python scripts/backtest-momentum.py --optimize --limit 5000

# Tests 192 configurations, finds optimal settings
```

## Using in Extension

### Console Commands

```javascript
// Get 10 hot numbers
window.__keno_getMomentumPredictions(10);

// With custom config
window.__keno_momentum.getPrediction(10, {
  detectionWindow: 7,
  momentumThreshold: 2.0,
});

// See all 40 numbers with momentum values
const gen = window.__keno_momentum.createGenerator({});
gen.getAllMomentumValues(state.currentHistory);
```

### Integration Example

Add to your overlay/UI:

```javascript
const momentumBtn = document.createElement("button");
momentumBtn.textContent = "Momentum";
momentumBtn.onclick = () => {
  const nums = window.__keno_getMomentumPredictions(10);
  console.log("Hot numbers:", nums);
  // Auto-select on board
  window.__keno_calculatePrediction(); // Or use nums directly
};
```

## Configuration Parameters

| Parameter         | Default | Range   | Effect                    |
| ----------------- | ------- | ------- | ------------------------- |
| detectionWindow   | 5       | 3-10    | Smaller = more reactive   |
| baselineWindow    | 50      | 25-100  | Larger = more stable      |
| momentumThreshold | 1.5     | 1.2-2.5 | Higher = fewer patterns   |
| refreshFrequency  | 5       | 5-20    | How often pattern updates |

## Comparison to Frequency-Based

| Method        | How It Works             | Best For          |
| ------------- | ------------------------ | ----------------- |
| **Frequency** | Counts total appearances | Long-term trends  |
| **Momentum**  | Detects acceleration     | Short-term bursts |

**Example**:

- Number appears 20 times in 100 rounds = 20% frequency
- Recently: 4 times in last 5 rounds = 80% recent frequency
- Momentum = 80% / 20% = **4.0x** ← Very hot!

## Typical Results

From 11,000+ round dataset:

```
Detection=5, Baseline=50, Threshold=1.5:
✓ Success Rate: 18-22%
✓ Avg Rounds to Hit: 12-15
✓ Hot Numbers Found: 8-12 per check
✓ Pattern Changes: Every 5 rounds
```

## When to Use

**Use Momentum When:**

- Number just started appearing frequently
- Looking for short-term bursts
- Want responsive, adaptive patterns

**Use Frequency When:**

- Want stable, consistent patterns
- Numbers trending over long period
- Prefer lower volatility

## Troubleshooting

**No hot numbers found:**

- Lower `momentumThreshold` (try 1.2)
- Increase `detectionWindow` (try 7-10)

**Too many false positives:**

- Raise `momentumThreshold` (try 2.0)
- Increase `baselineWindow` (try 75-100)

**Pattern too stable:**

- Decrease `refreshFrequency` (try 3)
- Lower `baselineWindow` (try 25-30)

**Not enough history error:**

- Need at least 50 rounds for baseline
- Falls back to frequency-based automatically

## Files Reference

```
src/momentum.js                  ← JavaScript module
scripts/backtest-momentum.py     ← Python backtester
scripts/test-momentum.py         ← Quick test
docs/momentum-generator.md       ← Full documentation
MOMENTUM-IMPLEMENTATION.md       ← Implementation summary
```

## Next Steps

1. ✅ Run test: `python scripts/test-momentum.py`
2. ✅ Quick backtest: `python scripts/backtest-momentum.py --limit 3000`
3. ⏳ Full optimization: `python scripts/backtest-momentum.py --optimize`
4. ⏳ Compare vs frequency on same data
5. ⏳ Integrate into UI with toggle button
6. ⏳ Add momentum display to tiles

## Support

See full documentation: `docs/momentum-generator.md`
