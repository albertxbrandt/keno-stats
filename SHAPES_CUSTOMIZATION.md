# Shapes Generator Customization

## Overview

Enhanced the shapes generator with user-configurable pattern selection, intelligent placement strategies, and flexible refresh options.

## Features Implemented

### 1. Pattern Selection

- **UI Control**: Dropdown with 13 options (1 random + 12 specific patterns)
- **Patterns Available**:
  - 🎲 Random (auto-selects from any pattern)
  - ➕ Plus
  - ✖️ Cross
  - 🔲 L-Shape
  - 🔳 T-Shape
  - 🔵 C-Shape
  - ◻️ Square
  - ➖ Horizontal Line
  - ↕️ Vertical Line
  - ◥ Diagonal Line
  - ↖️ Diagonal Line (reverse)
  - 〰️ Zigzag
  - ⬆️ Arrow

### 2. Placement Strategies

Users can choose how shapes are positioned on the Keno board:

#### Random Placement

- Default behavior
- Selects any valid position on the board
- No history analysis

#### Hot Numbers Area

- Analyzes last 20 rounds from history
- Calculates frequency of each number (1-40)
- Scores each valid position by sum of frequencies
- Places shape where it covers the most frequently drawn numbers
- Picks from top 3 positions (adds slight randomization)

#### Trending Position

- Uses momentum-like algorithm
- Compares recent frequency (last 5 rounds) vs baseline (previous 20 rounds)
- Calculates momentum ratio: `recentRate / baselineRate`
- Ratios > 1 indicate numbers trending upward
- Places shape in area with highest combined momentum
- Picks from top 3 momentum positions

### 3. Refresh Controls

#### Manual Refresh

- **Button**: 🔄 Refresh
- Immediately regenerates shape with current settings
- Updates `shapesLastRefresh` counter
- Can be used even when auto-interval is set

#### Auto-Refresh Interval

- **Input**: 0-20 rounds (0 = manual only)
- Automatically regenerates shape every N rounds
- Tracks rounds since last refresh
- Resets counter when interval is changed

### 4. Current Display

Shows current configuration:

- Selected pattern
- Placement strategy
- Last generated shape info (emoji, name, numbers)

## Code Changes

### src/state.js

Added configuration properties:

```javascript
shapesPattern: 'random',      // Pattern key or 'random'
shapesPlacement: 'random',    // 'random', 'hot', or 'trending'
shapesInterval: 0,            // Auto-refresh interval (0 = manual)
shapesLastRefresh: 0          // Round counter for last refresh
```

### src/shapes.js

**Updated Function Signature**:

```javascript
getShapePredictions(count, pattern, placement, historyData);
```

**New Helper Functions**:

- `selectHotPosition(validPositions, offsets, historyData)` - Frequency-based placement
- `selectTrendingPosition(validPositions, offsets, historyData)` - Momentum-based placement
- `adjustShapeSize(numbers, targetCount)` - Intelligent size adjustment

**Algorithm**:

1. Select shape based on `pattern` parameter
2. Get all valid positions on board for that shape
3. Score positions based on `placement` strategy
4. Generate shape at selected position
5. Adjust size if needed to match `count`
6. Store info for UI display

### src/overlay.js

Added UI controls in shapes-params panel:

- `shapes-pattern-select` - Pattern dropdown
- `shapes-placement-select` - Placement strategy dropdown
- `shapes-refresh-btn` - Manual refresh button
- `shapes-interval` - Auto-refresh interval input
- `shapes-current-display` - Current config display

**Event Handlers**:

- Pattern change → updates `state.shapesPattern`
- Placement change → updates `state.shapesPlacement`
- Interval change → updates `state.shapesInterval`, clamps to 0-20
- Refresh button → triggers immediate regeneration

### src/autoplay.js

**Updated Calls**:

- `generateAllPredictions()` - Passes config for comparison tracking
- `generateNumbers()` - Checks auto-refresh interval, passes config

**Auto-Refresh Logic**:

```javascript
const shouldRefresh =
  forceRefresh ||
  state.shapesLastRefresh === 0 ||
  (state.shapesInterval > 0 &&
    currentRound - state.shapesLastRefresh >= state.shapesInterval);
```

## Usage Examples

### Example 1: Target Hot Numbers with Arrow Shape

1. Select "⬆️ Arrow" from pattern dropdown
2. Select "🔥 Hot Numbers Area" from placement
3. Set interval to 0 (manual refresh)
4. Click "🔄 Refresh" to generate
5. Arrow will point to/cover most frequent numbers from last 20 rounds

### Example 2: Auto-Refresh Trending Square

1. Select "◻️ Square" from pattern dropdown
2. Select "📈 Trending Position" from placement
3. Set interval to 5 rounds
4. Shape will automatically regenerate every 5 rounds
5. Square targets board area with highest momentum

### Example 3: Random Pattern, Hot Placement

1. Select "🎲 Random" from pattern dropdown
2. Select "🔥 Hot Numbers Area" from placement
3. Set interval to 3 rounds
4. Each refresh picks random pattern but places it over hot numbers
5. Combines variety with strategic positioning

## Technical Notes

### Frequency Analysis (Hot Placement)

- Uses last 20 rounds from history
- Handles both old format (`round.drawn`) and new format (`round.kenoBet.state.drawnNumbers`)
- Fallback to random if no history available
- Scores are sums of individual number frequencies

### Momentum Analysis (Trending Placement)

- Requires at least 10 rounds of history
- Recent window: min(5, historyLength/4) rounds
- Baseline window: min(20, remaining rounds)
- Momentum = recentRate / baselineRate
- Fallback to random if insufficient data

### Size Adjustment

- If shape has fewer numbers than target: adds adjacent numbers
- If shape has more numbers: trims to target count
- Adjacent search uses 4-directional (up, down, left, right)
- Maintains sorted order

### Caching

- Shapes method respects auto-refresh interval
- Cached shape used if interval not reached
- Manual refresh button always forces regeneration
- Cache invalidates when interval changes

## Testing Checklist

- [x] Pattern dropdown changes `state.shapesPattern`
- [x] Placement dropdown changes `state.shapesPlacement`
- [x] Interval input clamps to 0-20
- [x] Manual refresh triggers immediate generation
- [x] Auto-refresh works at specified interval
- [x] Hot placement targets frequent numbers
- [x] Trending placement targets momentum areas
- [x] Random placement works as fallback
- [x] UI displays current configuration
- [x] Build completes successfully
- [ ] Live testing on Stake.com (requires manual verification)

## Future Enhancements

Possible additions:

- Save/load custom shape configurations
- Visual preview of shape before generation
- Heatmap overlay showing placement scores
- Custom shapes editor (define your own offsets)
- Strategy presets (e.g., "Conservative", "Aggressive")
- Performance tracking by placement strategy
