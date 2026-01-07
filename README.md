# Stake Tools Browser Extension

A Chrome/Firefox browser extension providing **Keno statistics tracking** and **site-wide utilities** for Stake.com.

## 🎯 Main Features

### 🎲 Keno Stats Tracker

Advanced statistics and analysis for Keno games with heatmaps, generators, and profit tracking.

### 💣 Mines Stats Tracker

Real-time multiplier tracking and bet history for Mines games with comprehensive statistics.

### 🛠️ Stake Tools (Site-Wide)

Utility toolkit available across all Stake pages - coin flipper, random numbers, game picker, VIP calculator, and more.

## ⚠️ Disclaimer

**This extension is for experimental and educational purposes only.**

- The extension tracks game statistics and provides heatmap analysis based on historical data.
- **It does NOT guarantee wins** and should not be relied upon for making betting decisions.
- Use this extension **at your own discretion**.
- Gambling carries risk. Past performance and statistical patterns do not predict future outcomes.

## Features

## 🎲 Keno Stats Tracker (Keno Pages Only)

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

## 💣 Mines Stats Tracker (Mines Pages Only)

### 📊 Real-Time Statistics

- **Current Multiplier Tracking**: Live multiplier bar that updates with each reveal
- **Bet History**: Complete history of all bets with outcomes
- **Win/Loss Tracking**: Session and total statistics
- **Auto-Reset**: Stats reset when new game starts

### 📈 Multiplier Bar

- Visual progress bar showing current multiplier
- Color-coded by risk level (green → yellow → red)
- Updates in real-time as tiles are revealed
- Shows exact multiplier value (e.g., "3.45x")

### 🎯 Game Info Display

- Mines count (difficulty level)
- Tiles revealed count
- Current bet amount
- Win/loss status for completed games

### 📝 Bet History Panel

- Chronological list of all completed games
- Shows: Mines count, multiplier achieved, bet amount, profit/loss
- Color-coded profit (green) and loss (red)
- Expandable to view full details

## 🛠️ Stake Tools (All Pages)

Site-wide toolbar with quick-access utilities available on any Stake page:

### 🪙 Coin Flipper

- Beautiful 3D coin flip animation
- Heads/Tails tracking with statistics
- History of last 20 flips
- Persistent stats across sessions

### 🔢 Random Number Generator

- Configurable min/max range (default 1-100)
- Generate 1-100 numbers at once
- Allow/prevent duplicates toggle
- Copy to clipboard
- History of last 20 generations

### 🎮 Random Game Picker

- Scans current page for available games
- Slot machine shuffle animation (20 cycles)
- Click "Play Now" to navigate instantly
- History of last 10 picks with thumbnails
- Auto-detects game name, image, and category

### 🔮 Magic 8-Ball

- Fortune teller with 20 classic responses
- Shake animation on each use
- Question history tracking
- Mysterious predictions for fun decisions

### 👑 VIP Calculator

- Opens Stake's VIP progress modal
- Shows wagered amount and remaining for next level
- Floating side panel with real-time data
- Tracks progress across 10 VIP levels (Bronze → Diamond)
- SPA navigation (no page reload)

## 🏗️ Architecture

Multi-game architecture with separate modules for each feature:

```
src/
├── games/
│   ├── keno/           # Keno-specific features
│   │   ├── content.js  # Entry point
│   │   ├── core/       # State, storage, events
│   │   ├── generators/ # Number generation strategies
│   │   ├── storage/    # Persistence (history, settings, patterns, etc.)
│   │   ├── ui/         # Preact components
│   │   │   ├── components/
│   │   │   │   ├── sections/      # Overlay sections
│   │   │   │   ├── modals/        # Modal dialogs
│   │   │   │   ├── generator/     # Generator sub-components
│   │   │   │   └── shared/        # Keno-specific shared components
│   │   │   ├── App.jsx            # Root component
│   │   │   ├── ModalsManager.jsx  # Modal coordination
│   │   │   └── overlayInit.js     # Initialization
│   │   ├── utils/      # Keno-specific utilities
│   │   ├── bridges/    # Window globals
│   │   └── hooks/      # Preact hooks
│   │
│   └── mines/          # Mines-specific features
│       ├── content.js  # Entry point
│       ├── core/       # State management
│       ├── ui/         # Multiplier bar and stats UI
│       └── utils/      # Mines-specific utilities
│
├── stake/              # Site-wide features
│   ├── content.js      # Entry point
│   ├── coordinator.js  # Game detection and routing
│   ├── core/           # State, storage for toolbar
│   ├── features/       # Feature modules (VIP, etc.)
│   ├── ui/             # Toolbar and utility components
│   │   ├── Toolbar.jsx          # Main toolbar
│   │   ├── UtilitiesManager.jsx # Utility renderer
│   │   ├── CoinFlipper.jsx
│   │   ├── RandomNumberGen.jsx
│   │   ├── RandomGamePicker.jsx
│   │   └── Magic8Ball.jsx
│   └── hooks/          # useUtilities context
│**Lucide Icons** for crisp vector graphics (1,400+ icons)
- Draggable modals and overlays with mouse and touch support
- Modal system with centralized state management (useModals hook)
- Shared component library across all features
- Consistent design system (colors, spacing, typography
│   │   ├── Modal.jsx
│   │   ├── ToggleSwitch.jsx
│   │   ├── DragHandle.jsx
│   │   ├── CollapsibleSection.jsx
│   │   └── NumberInput.jsx
│   ├── constants/      # Colors, styles, defaults
│   ├── storage/        # Storage utilities
│   └── utils/          # Shared helper functions
│
└── dashboard/          # Separate bet history dashboard
    ├── dashboard-entry.js
    ├── Dashboard.jsx
    ├── sections/
    ├── components/
    └── utils/

dist/
├── stake.bundle.js      # Main extension (200.5kb)
└── dashboard.bundle.js  # Bet history UI (39.0kb)

interceptor.js           # Page-level data capture (MAIN world)
eslint.config.mjs        # Code quality (ESLint v9)
```

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
  ### January 2026

- 🏗️ **Major restructure**: Multi-game architecture with separate modules
- 💣 **New**: Mines stats tracker with multiplier bar and bet history
- 🛠️ **New**: Site-wide toolbar with utilities (Coin Flipper, Random Numbers, Game Picker, Magic 8-Ball, VIP Calculator)
- 🎨 **New**: Lucide Icons integration (replaced all emojis)
- 🔧 **New**: Shared component library for consistent UI
- 👑 **New**: VIP Calculator with floating progress panel (10 levels tracked)
- 📦 **Improved**: Better code organization (src/games/, src/stake/, src/shared/)
- 🎯 **Improved**: Toolbar styling matches Keno overlay design system
- 📊 **Improved**: Coordinator system for game detection and routing
- 🎨 **Improved**: Coin Flipper redesign with Club/Spade card suit icons and vibrant gradients

###

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
