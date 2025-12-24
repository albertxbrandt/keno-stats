# Keno Stats Extension

A Chrome/Firefox browser extension that tracks Keno game statistics on Stake.com.

## ⚠️ Disclaimer

**This extension is for experimental and educational purposes only.**

- The extension tracks game statistics and provides heatmap analysis based on historical data.
- **It does NOT guarantee wins** and should not be relied upon for making betting decisions.
- Use this extension **at your own discretion**.
- Gambling carries risk. Past performance and statistical patterns do not predict future outcomes.

## Features

### 🗺️ Heatmap Analysis

- **Hot Numbers Mode**: View which numbers appear most frequently based on historical data
- **Trending Mode**: See which numbers are gaining momentum (appearing more in recent games vs baseline)
- **Adjustable Sample Size**: Analyze anywhere from 1 to all historical rounds (default 100)
- **Visual Indicators**: Color-coded percentages directly on the Keno board
  - Green = Hot/Trending up
  - Red = Cold/Trending down
  - White = Neutral

### 🎲 Number Generator

Universal number prediction system with multiple strategies:

- **Frequency** (Hot): Most frequently drawn numbers in sample
- **Cold**: Least frequently drawn numbers in sample
- **Mixed**: Combination of hot and cold numbers
- **Average**: Numbers with median frequency
- **Momentum**: Numbers with increasing frequency (trending analysis)
- **Shapes**: Place geometric patterns on the board with intelligent positioning
  - 12+ pattern types (L-shape, T-shape, corners, edges, etc.)
  - 3 placement strategies: Random, Hot (frequency-based), Trending (momentum-based)

**Generator Settings:**

- **Unified Sample Size**: One parameter controls analysis window for all methods (default 20)
- **Count**: How many numbers to generate (1-10)
- **Auto-Refresh**: Regenerate predictions every N rounds (0 = manual)
- **Auto-Select**: Automatically apply generated numbers to the board
- **Live Preview**: See next predictions and countdown to auto-refresh

### 📊 Pattern Analysis

Find common N-number combinations (3-10) that appear together frequently:

- View occurrence history with timestamps and bet numbers
- Click patterns to auto-select those numbers on the board
- See detailed statistics (total patterns, average appearance rate)
- Performance-optimized with caching system

### 📈 Profit/Loss Tracking

- Multi-currency support (BTC, LTC, DOGE, ETH, XRP, TRX, BNB, USDT, USDC, EOS, BCH)
- Session and total profit tracking
- Bet book export feature for complete betting history analysis
- Automatic profit calculation from actual game results

### 📝 Unlimited History

- Records every round with complete data (hits, misses, drawn numbers, selected numbers, timestamp)
- Hover over history items to highlight results on the board
- Export bet history for external analysis
- No round limit (previous 100-round cap removed)

### 💾 Saved Number Sets

- Save and name your favorite number combinations
- Quick-load saved sets with one click
- Manage multiple saved strategies
- Import/export saved sets

## Installation

1. Clone or download this repository
2. Run `npm install` to install dependencies
3. Run `npm run build` to bundle the extension
4. Load the extension unpacked:
   - **Chrome**: `chrome://extensions/` → Enable "Developer mode" → "Load unpacked" → Select this folder
   - **Firefox**: `about:debugging` → "This Firefox" → "Load Temporary Add-on" → Select `manifest.json`

## Development

### Build Commands

- `npm install` - Install dependencies
- `npm run build` - Build for production (minified)
- `npm run watch` - Development mode with hot reload
- `npm run lint` - Check code quality with ESLint
- `npm run lint:fix` - Auto-fix linting issues

### Project Structure

- `src/` - Source code (ES6 modules + Preact JSX)
  - `core/` - State management and storage wrappers
  - `storage/` - All persistence operations (history, settings, saved numbers, patterns, profit/loss)
  - `generators/` - Number generation strategies
  - `ui/` - Preact components and UI logic
    - `components/` - Reusable UI components (Overlay, sections, modals, shared)
  - `utils/` - Utility functions organized by type
    - `dom/` - DOM operations (utils, tileSelection, domReader, heatmap, profitLossUI)
    - `calculations/` - Pure math functions (payouts, profits, patterns)
    - `analysis/` - Data analysis helpers
  - `bridges/` - Window global functions for cross-context access
  - `hooks/` - React/Preact hooks (useModals)
- `dist/` - Built output (bundled with esbuild)
- `interceptor.js` - Page-level data interception (runs in MAIN world)
- `eslint.config.mjs` - Code quality configuration (ESLint v9)

### Code Quality

- ESLint v9 with flat config format
- Configured for browser + webextensions environment
- Enforces unused variable detection (prefix with `_` for intentional unused)
- Run `npm run lint` before committing

### Architecture

The extension operates in two security contexts:

1. **MAIN world** (`interceptor.js`): Intercepts fetch() calls to capture game data
2. **ISOLATED world** (`src/` modules): Extension sandbox with Preact UI and full API access

Data flows: `interceptor.js` → `window.postMessage()` → `content.js` → Module functions → Chrome storage API

The UI is built with **Preact** (3KB React alternative) for maintainability and small bundle size:

- Component-based architecture with hooks
- Draggable overlay with mouse and touch support
- Modal system with centralized state management
- Reusable shared components (ToggleSwitch, CollapsibleSection, DragHandle, etc.)

## How It Works

The extension intercepts Keno game data from Stake.com and provides statistical analysis:

1. **Data Capture**: Intercepts GraphQL responses containing game results
2. **History Storage**: Records drawn numbers, selected numbers, hits, and misses
3. **Statistical Analysis**:
   - Frequency analysis for hot/cold numbers
   - Momentum detection for trending analysis
   - Pattern mining for common combinations
4. **Visual Feedback**: Displays statistics directly on the game board
   ⚠️ **Important Reminders**:

- This extension is for **experimental and educational purposes only**
- Statistical analysis of past results **does not predict future outcomes**
- Keno is a game of chance with mathematically proven house edge
- No strategy can overcome the house edge in the long run
- Only use this tool for learning about probability and statistics
- **Never rely on predictions for real money decisions**
- Gamble responsibly and within your limits
- Consider the entertainment value only, not profit potential

### What This Extension Does:

✅ Track historical game data  
✅ Display statistical patterns  
✅ Provide analysis tools  
✅ Help understand probability concepts

### What This Extension Does NOT Do:

❌ Predict future outcomes  
❌ Guarantee wins  
❌ Overcome house edge  
❌ Replace responsible gambling practices

## Contributing

Contributions welcome! Please:

- Follow the existing code style
- Run `npm run lint` before submitting
- Test your changes thoroughly
- Update documentation as needed

## Recent Updates

### December 2025

- ✨ Added heatmap mode toggle (hot numbers vs trending momentum)
- ✨ Unified sample size system across all generators
- ✨ Added cold area placement for shapes generator
- ✨ Live preview system for number generator
- ✨ Momentum advanced settings with auto-reset
- 🎨 UI reorganization with collapsible sections
- 🧹 Code cleanup - removed 71 lines of unused functions
- ⚙️ ESLint configuration for code quality
- 📊 Pattern analysis caching for improved performance
- 🔧 Fixed timing issues with DOM observation patterns (replaced setTimeout with MutationObserver)

**Hot Numbers**: Simple frequency count over sample window

```
frequency = count / total_games
```

**Trending/Momentum**: Compares recent vs baseline frequency

```
momentum_ratio = (recent_frequency / recent_window) / (baseline_frequency / baseline_window)
```

**Pattern Analysis**: Finds N-number combinations that appear together in drawn results

- Uses combinatorial analysis on historical data
- Cached for performance with large datasets
- Ranks patterns by occurrence frequency

**Shape Placement**:

- **Random**: Any valid position
- **Hot**: Positions covering most frequently drawn numbers
- **Trending**: Positions with highest momentum scores

## Responsible Use

- Only use this extension for testing and learning
- Do not rely on predictions for real money decisions
- Understand that randomness cannot be predicted
- Gamble responsibly and within your limits

## License

Experimental - use at your own risk.
