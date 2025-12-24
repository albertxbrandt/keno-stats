# Keno Tracker Browser Extension - AI Coding Instructions

## Architecture Overview

This is a Chrome/Firefox browser extension that tracks Keno game statistics on Stake.com. It operates across **two isolated security worlds** with distinct responsibilities:

- **`interceptor.js` (MAIN world)**: Intercepts `fetch()` calls at page startup (`document_start`) to extract live game data from GraphQL responses
- **`src/` modules (ISOLATED world)**: Modular ES6 codebase bundled via esbuild into `dist/content.bundle.js` for the extension sandbox
- **Data Flow**: `interceptor.js` → `window.postMessage()` → `src/content.js` → Module functions → Chrome storage API

### Module Architecture (src/)

Code split across three main domains with clear separation of concerns:

#### **src/keno-tool/** - Main extension features

**Core:**

- **`content.js`**: Entry point, message listener, initialization orchestration, round processing
- **`core/state.js`**: Centralized reactive state (all `state.*` properties live here)
- **`core/stateEvents.js`**: Event system for reactive state updates
- **`core/storage.js`**: Keno-tool-specific storage wrapper (re-exports from shared/)

**UI (Preact Components):**

- **`ui/App.jsx`**: Root Preact component, wraps Overlay and ModalsManager with ModalsProvider
- **`ui/overlayInit.js`**: Overlay initialization and footer button injection
- **`ui/numberSelection.js`**: Generator coordination, prediction caching, auto-select logic, preview system
- **`ui/previewHighlight.js`**: Preview highlight module for predicted numbers
- **`ui/ModalsManager.jsx`**: Central modal coordination using useModals hook
- **`ui/components/Overlay.jsx`**: Main draggable overlay container with tab switching
- **`ui/components/shared/`**: Reusable UI primitives (DragHandle, ToggleSwitch, CollapsibleSection, NumberInput, etc.)
- **`ui/components/sections/`**: Major overlay sections (HeatmapSection, GeneratorSection, HitsMissSection, ProfitLossSection, PatternAnalysisSection, RecentPlaysSection, HistorySection)
- **`ui/components/generator/`**: Generator sub-components (MethodSelector, AutoRefreshControl, GeneratorPreview, ShapesParams, MomentumParams)
- **`ui/components/modals/`**: Modal dialogs (SavedNumbersModal, CombinationHitsModal, PatternAnalysisModal, PatternLoadingModal, ComparisonModal)

**Generators:**

- **`generators/cache.js`**: CacheManager class - universal refresh interval logic, prediction caching
- **`generators/base.js`**: BaseGenerator class - shared functionality (sample selection, frequency counting)
- **`generators/frequency.js`**: Hot numbers (most frequent)
- **`generators/cold.js`**: Cold numbers (least frequent)
- **`generators/mixed.js`**: Hot + Cold combined
- **`generators/average.js`**: Median frequency numbers
- **`generators/momentum.js`**: Trending numbers (momentum analysis)
- **`generators/shapes.js`**: Shape-based selection (wraps shapesCore)
- **`generators/shapesCore.js`**: Shape definitions, placement strategies (hot/trending/random)

**Bridges:**

- **`bridges/windowGlobals.js`**: Consolidated window.\__keno_\* global functions for cross-context access

**Hooks:**

- **`hooks/useModals.js`**: ModalsProvider context for managing modal state across components

#### **src/dashboard/** - Separate bet history dashboard

**Entry:**

- **`dashboard-entry.js`**: Entry point for dashboard.html (separate from keno-tool)
- **`Dashboard.jsx`**: Root dashboard component

**Components:**

- **`sections/BetHistory.jsx`**: Main bet history table with search/filter/pagination
- **`components/BetTable.jsx`**: Table component for displaying bets
- **`components/SearchBar.jsx`**: Search and filter controls
- **`components/Pagination.jsx`**: Pagination controls
- **`components/SettingsModal.jsx`**: Column visibility settings
- **`components/BetDetailsModal.jsx`**: Detailed bet view with visual board

**Utils:**

- **`utils/storage.js`**: Dashboard-specific storage utilities (re-exports from shared/)

#### **src/shared/** - Shared code used by both keno-tool and dashboard

**Storage Layer:**

- **`storage/history.js`**: Game history CRUD with chunked storage (1000 rounds per chunk), includes importHistory for bulk imports
- **`storage/settings.js`**: Generator and heatmap settings persistence
- **`storage/savedNumbers.js`**: CRUD for saved number combinations
- **`storage/patterns.js`**: Pattern cache management with TTL
- **`storage/comparison.js`**: Comparison tracking data (in-memory)
- **`storage/profitLoss.js`**: Profit/loss data persistence and state management

**Constants:**

- **`constants/colors.js`**: Color palette and theme constants
- **`constants/styles.js`**: Spacing, border radius, and layout constants
- **`constants/defaults.js`**: Default values for generators and settings

**Utils:**

- **`utils/dom/`**: DOM operations
  - `utils.js`: DOM helpers (simulatePointerClick, clearTable, waitForBetButtonReady)
  - `tileSelection.js`: Tile selection/deselection, waitForTilesCleared, replaceSelection, clearHighlight
  - `domReader.js`: DOM state reading (getSelectedTileNumbers, getIntValue, etc.)
  - `heatmap.js`: Heatmap visualization, tile highlighting, clearHeatmap
  - `profitLossUI.js`: Profit/loss UI updates
- **`utils/calculations/`**: Pure math/analysis functions
  - `payoutCalculations.js`: Payout analysis and multiplier calculations
  - `profitCalculations.js`: Profit/loss calculations, currency formatting
  - `patternAlgorithms.js`: Pattern finding algorithms (combinatorial analysis)
- **`utils/analysis/`**: Data analysis helpers
  - `combinationAnalysis.js`: Combination hit rate analysis
- **`utils/stats.js`**: Statistics observer and multiplier bar updates

## Critical Implementation Patterns

### 1. Cross-World Communication (Message Passing)

Messages flow one direction: Page → Extension sandbox via `window.postMessage()`:

```javascript
// interceptor.js sends:
window.postMessage(
  { type: "KENO_DATA_FROM_PAGE", payload: { drawnNumbers, selectedNumbers } },
  "*"
);

// src/content.js listens (entry point):
window.addEventListener("message", (event) => {
  if (event.source !== window || event.data.type !== "KENO_DATA_FROM_PAGE")
    return;
  const rawDrawn = data.drawnNumbers || [];
  const drawn = rawDrawn.map((n) => n + 1); // Transform 0-39 to 1-40
  saveRound({ hits, misses, drawn, selected, time: Date.now() });
  // Trigger auto-play next bet if active
});
```

**Key insight**: The source check prevents external scripts from spoofing messages. Number transformation happens in `content.js` after message receipt.

### 2. URL-Scoped Functionality

Critical safety check: Functions verify `window.location.href.includes("keno")` before DOM manipulation:

- If not on Keno page: removes injected buttons, hides overlay, exits early
- Prevents errors on non-Keno game pages within Stake.com

### 3. Preact Component Architecture

The UI is built with Preact (3KB React alternative) for maintainability and performance:

**Component Hierarchy:**

```
App (ModalsProvider wrapper)
├── Overlay (draggable container)
│   ├── DragHandle (mouse + touch drag support)
│   ├── HeatmapSection
│   ├── GeneratorSection
│   ├── HitsMissSection
│   ├── ProfitLossSection
│   ├── PatternAnalysisSection
│   ├── RecentPlaysSection
│   └── HistorySection
└── ModalsManager (modal coordination)
    ├── SavedNumbersModal
    ├── CombinationHitsModal
    ├── PatternAnalysisModal
    ├── PatternLoadingModal
    └── ComparisonModal
```

**Key patterns:**

- Shared components in `ui/components/shared/` (ToggleSwitch, CollapsibleSection, NumberInput, etc.)
- State managed via `state` object imported from `core/state.js`
- Modals controlled via `useModals` hook context
- JSX transpiled by esbuild with `--jsx=automatic --jsx-import-source=preact`

### 4. Number Transformation (Keno-Specific)

Stake API returns 0-39 indices; UI displays 1-40 board:

```javascript
const drawn = rawDrawn.map((n) => n + 1); // Always add 1 from API
```

This offset is applied in `content.js` after message receipt. Tests should verify this transformation.

### 5. Storage Abstraction

Supports both Chrome and Firefox via conditional API selection:

```javascript
const storageApi = typeof browser !== "undefined" ? browser : chrome;
```

- History stored as **unlimited** array (changed from 100-round cap for bet book feature)
- `saveRound()` automatically triggers `updateHistoryUI()` and heatmap refresh via callbacks
- Round format: `{ hits, misses, drawn, selected, time }`

### 5. DOM Observation Pattern (Timing Fix - Dec 2024)

**Problem**: Using `setTimeout()` with arbitrary delays caused race conditions when the game state wasn't ready.

**Solution**: Use DOM observation to wait for actual state changes:

**Bet Button Ready** (utils.js):

```javascript
export function waitForBetButtonReady(timeout = 5000) {
  return new Promise((resolve, reject) => {
    const betButton = document.querySelector('[data-testid="bet-button"]');
    if (!betButton) return reject(new Error("Bet button not found"));

    const observer = new MutationObserver(() => {
      const isReady =
        betButton.getAttribute("data-test-action-enabled") === "true";
      if (isReady) {
        observer.disconnect();
        resolve();
      }
    });

    observer.observe(betButton, {
      attributes: true,
      attributeFilter: ["data-test-action-enabled"],
    });

    // Check initial state
    if (betButton.getAttribute("data-test-action-enabled") === "true") {
      observer.disconnect();
      resolve();
    }

    // Timeout fallback
    setTimeout(() => {
      observer.disconnect();
      reject(new Error("Timeout"));
    }, timeout);
  });
}
```

**Tiles Cleared** (tileSelection.js):

```javascript
export function waitForTilesCleared(maxWaitMs = 2000) {
  return new Promise((resolve) => {
    const checkCleared = () => {
      const tiles = getAllTiles();
      const anySelected = tiles.some(isTileSelected);

      if (!anySelected) {
        resolve(); // All cleared
      } else if (Date.now() - startTime > maxWaitMs) {
        resolve(); // Timeout - proceed anyway
      } else {
        setTimeout(checkCleared, 50); // Poll every 50ms
      }
    };
    setTimeout(checkCleared, 50);
  });
}
```

**Key principle**: Never use arbitrary `setTimeout()` delays for DOM state changes. Always observe the actual state or poll for the condition you need.

### 6. Auto-Save System (Generator Settings - Dec 2024)

All generator settings persist automatically via `saveGeneratorSettings()` / `loadGeneratorSettings()`:

**Saved settings** (11 properties):

- `generatorMethod`, `generatorCount`, `generatorInterval`, `generatorAutoSelect`, `generatorSampleSize`
- Shapes: `shapesPattern`, `shapesPlacement`
- Momentum: `momentumDetectionWindow`, `momentumBaselineGames`, `momentumThreshold`, `momentumPoolSize`

**Implementation pattern**:

```javascript
// In event handlers (overlay.js):
methodSelect.addEventListener("change", (e) => {
  state.generatorMethod = e.target.value;
  saveGeneratorSettings(); // Auto-save immediately
});

// On init (overlay.js → storage.js):
export function initOverlay() {
  loadGeneratorSettings().then(() => {
    createOverlay();
    // Apply loaded settings to UI controls
  });
}
```

**Critical**: Every setting change must call `saveGeneratorSettings()` to persist immediately.

### 7. Live Preview System (Generator - Dec 2024)

Shows "next numbers" that would be generated if clicking Refresh now, plus countdown to auto-refresh.

**Architecture**:

- **Preview UI**: In overlay.js generator section, displays method name, predicted numbers, rounds countdown
- **Update logic**: `updateGeneratorPreview()` in numberSelection.js
- **Key behavior**: Generates _fresh_ predictions without updating cache or state (preview-only)

**Implementation**:

```javascript
export function updateGeneratorPreview() {
  const method = state.generatorMethod;
  const count = state.generatorCount;
  const interval = state.generatorInterval;

  // Update method label
  const methodLabel = document.getElementById("generator-preview-method");
  if (methodLabel) methodLabel.textContent = `🔥 ${method}`;

  // Show countdown
  const roundsDisplay = document.getElementById(
    "generator-rounds-until-refresh"
  );
  if (interval === 0) {
    roundsDisplay.textContent = "Manual";
  } else {
    const roundsSinceRefresh =
      state.currentHistory.length - state.generatorLastRefresh;
    const remaining = Math.max(0, interval - roundsSinceRefresh);
    roundsDisplay.textContent = `${remaining}/${interval} rounds`;
  }

  // Generate preview (if auto-refresh enabled)
  if (interval > 0) {
    const generator = generatorRegistry.get(method);
    const config = {
      /* method-specific config */
    };
    const previewPredictions = generator.generate(
      count,
      state.currentHistory,
      config
    );

    // Display predictions (don't update state or cache!)
    displayPreviewNumbers(previewPredictions);
  }
}
```

**Critical**: Preview must NOT call `generateNumbers()` (causes recursion). Call `generator.generate()` directly.

### 8. Cache Manager (Universal Refresh - Dec 2024)

All generators use `CacheManager` class for universal refresh interval logic:

**How it works**:

1. Check cache: `const cached = cacheManager.get(method, count, state, config)`
2. If cache valid (within interval): return cached predictions
3. If cache expired or missing: generate fresh predictions
4. Store in cache: `cacheManager.set(method, count, predictions, state, config)`

**Cache key**: Combines method, count, and config (e.g., `"frequency-5-{\"sampleSize\":20}"`)

**Interval logic**:

- `interval = 0` (manual): cache never expires, user must click Refresh
- `interval > 0` (auto): cache expires after N rounds (tracked via `roundNumber` stored with cache)

**Cache validation**:

```javascript
const roundsSinceCache = currentRound - cachedRoundNumber;
if (roundsSinceCache < interval) {
  return cachedPredictions; // Still valid
}
return null; // Expired
```

### 9. Shapes Placement Strategies (Dec 2024)

Shapes generator places patterns on the board using three strategies:

**Random**: Picks any valid position for the shape

**Hot**: Places shape where it covers most frequently drawn numbers

- Analyzes last 20 rounds (or generator sample size)
- Counts frequency of each number 1-40
- Scores each valid position by sum of frequencies of shape's numbers
- Picks randomly from **top 3 positions** (adds variety)

**Trending**: Places shape on numbers with momentum (increasing frequency)

- Compares recent window (5 rounds) vs baseline (20 rounds)
- Calculates momentum ratio: `recentRate / baselineRate` for each number
- Ratio > 1 means number is "trending up"
- Scores positions by sum of momentum values
- Picks randomly from top 3 positions

**Example** (hot placement):

```javascript
function selectHotPosition(validPositions, offsets, historyData) {
  // Count frequency
  const frequency = countFrequency(historyData.slice(-20));

  // Score each position
  const scoredPositions = validPositions.map((pos) => {
    const shapeNumbers = generateShape(pos.row, pos.col, offsets);
    const score = shapeNumbers.reduce((sum, num) => sum + frequency[num], 0);
    return { ...pos, score };
  });

  // Return random from top 3
  scoredPositions.sort((a, b) => b.score - a.score);
  const topPositions = scoredPositions.slice(0, 3);
  return topPositions[Math.floor(Math.random() * topPositions.length)];
}
```

## Key Components & Patterns

### Game Data Extraction (interceptor.js)

- Safeguard: `if (!window.kenoInterceptorActive)` prevents multiple injections
- Intercepts URLs matching `graphql` or `bet`
- Handles two JSON response paths: `data.kenoBet.state` or direct `kenoBet.state`
- Extracts: `drawnNumbers`, `selectedNumbers` from `state` object
- Console logs for debugging: styled green (`%c ✅ BET DATA FOUND!`) on success, errors on parse failure

### Round Data Structure

```javascript
{ hits: [1,5,12,...], misses: [3,7,18,...], drawn: [2,5,9,...], selected: [1,5,12,...], time: Date.now() }
```

- `hits`: selected numbers that were drawn (intersection of `selected` and `drawn`)
- `misses`: drawn numbers not in selection
- `drawn`: all 20 numbers drawn by game (used by `stats.js` for probability calculations)
- `selected`: all numbers the player picked (used by `stats.js` for hit count matching)
- Both `hits` and `misses` sorted ascending; used in heatmap % calculations

### Highlight System

Three distinct highlight modes triggered on DOM tile buttons:

1. **Round highlight** (hover history): Green inset shadow for hits, red for misses
2. **Prediction highlight** (predict mode ON): Blue glow with scale(1.1), dims non-predicted tiles to 0.4 opacity
3. **Heatmap background**: Percentage text in bottom-right corner, colored by frequency threshold

### Toggle States & Modes

- `isHotMode`: Sample last 5 games (slider labeled "Use last 5 games?") vs all 100
- `isPredictMode`: Show top N predicted numbers overlay; auto-recalculates on mode toggle or count change
- `isOverlayVisible`: Main UI panel display (toggle button in game footer)
- **Auto-Play Mode**: DISABLED for TOS compliance (code commented out, can be re-enabled if needed)

### Heatmap Algorithm

Runs every 2 seconds:

1. Count frequency of each number (1-40) in sample (last 5 or all 100)
2. Calculate percentage: `(count / totalGames) * 100`
3. Color code: Green ≥40% (hot mode) or ≥30% (all); Red ≤0% or ≤10% (cold); default white
4. Create/update percentage badge on each tile

### Prediction Algorithm

Ranks numbers by appearance frequency in sample; returns top N:

```javascript
const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
const topPicks = sorted.slice(0, count).map((entry) => parseInt(entry[0]));
```

### Pattern Analysis (`patterns.js`)

Analyzes historical data to find number combinations of a specific size (3-10) that frequently appear together in drawn numbers:

- **`findCommonPatterns(patternSize, topN, useCache)`**: Generates all combinations of patternSize numbers from drawn results, ranks by frequency; supports caching to improve performance on large datasets
- **`getPatternStats(patternSize)`**: Calculates total unique patterns and average appearance rate for given size
- **`showPatternAnalysisModal(patternSize)`**: Displays loading modal, computes patterns asynchronously via setTimeout, then shows results modal with top 15 patterns and statistics
- **`showLoadingModal()`**: Creates animated spinner modal to provide UI feedback during computation
- **`showResultsModal(patternSize, patterns, stats)`**: Displays pattern cards with occurrence dropdowns and click-to-select functionality
- Uses combination algorithm to find all possible N-number sets that appeared together in the 20 drawn numbers
- Example: Size 5 finds which 5-number combinations (like [3, 12, 18, 25, 37]) appeared together most often

#### Pattern Caching System

Pattern analysis uses a Map-based caching system to avoid recomputing expensive combinatorial calculations:

- **Cache key format**: `${patternSize}-${historyLength}` ensures cache invalidates when history changes
- **Cache TTL**: 5 minutes (300,000ms) - results expire after this duration to balance freshness vs performance
- **Cache structure**: `patternCache` Map with methods: `get(key)`, `set(key, value)`, `clear()`
- **Cache invalidation**: Automatically cleared via `window.__keno_clearPatternCache()` when `saveRound()` adds new data
- **Performance**: Cache hit logs "[patterns] Using cached data"; miss triggers computation and stores result
- **Global hook**: `window.__keno_clearPatternCache` exposed for manual cache clearing from console/UI
- **Async UI**: Loading modal renders via setTimeout(100ms) to allow spinner display before blocking computation starts

## Selector & DOM Queries

All game tiles queried via: `document.querySelector('div[data-testid="keno-tiles"]')`
Footer button injection point: `document.querySelector('.game-footer .stack')`

**Assumption**: Stake's Keno UI maintains these selectors. If breaking, check inspector and update selectors accordingly.

## Build System & Development Workflow

### Build Commands (package.json)

- **`npm run build`**: Bundles `src/content.js` → `dist/content.bundle.js` with esbuild (minified, sourcemap)
- **`npm run watch`**: Development mode with hot reload (no minification)
- **`npm run lint`**: Run ESLint to check code quality
- **`npm run lint:fix`**: Auto-fix linting issues where possible
- **esbuild config**: `--bundle --platform=browser` treats all `src/*.js` imports as ES6 modules

### Code Quality & Linting

**ESLint Configuration:**

- Uses ESLint v9 with flat config format (`eslint.config.mjs`)
- Configured for browser + webextensions environment
- Allows `console` statements (needed for extension logging)
- Warns on unused variables (prefix with `_` to mark as intentional)
- Ignores: `dist/`, `node_modules/`, `data/` folders

**Linting Rules:**

- ✅ **No unused variables**: Remove or prefix with `_` if intentional
- ✅ **No unused imports**: Clean up unused imports
- ✅ **Consistent error handling**: Use `_err` or `_e` for ignored catch blocks
- ✅ **Function parameters**: Use `_paramName` for required but unused parameters
- ✅ **Run before commit**: Always run `npm run lint` before committing

**Example patterns:**

```javascript
// ✅ Good - unused param marked with underscore
array.map((_item, index) => index);

// ✅ Good - ignored error in catch
catch (_e) { /* fallback behavior */ }

// ❌ Bad - unused variable
const result = getData();
// Use it or remove it

// ✅ Good - remove unused imports
import { state } from './state.js'; // Only import what you use
```

### Module Loading & Initialization Order

1. `interceptor.js` loads at `document_start` (MAIN world) - starts monitoring fetch requests
2. `dist/content.bundle.js` loads at `document_idle` (ISOLATED world) - entry point is `src/content.js`
3. `content.js` imports all modules and calls `loadHistory()` → `initOverlay()` → `initStatsObserver()`
4. Message listener in `content.js` processes intercepted game data and coordinates module updates

### Cross-Module Communication Patterns

- **State sharing**: Import `state` object from `state.js` - mutate directly, no setters
- **Function callbacks**: `storage.js` calls `updateHistoryUI()` and `window.__keno_updateHeatmap()` after saves
- **Window hooks**: Modules expose functions via `window.__keno_*` for cross-module calls from event handlers in HTML strings
  ```javascript
  // In heatmap.js: window.__keno_highlightRound = highlightRound;
  // In overlay.js: div.addEventListener('mouseenter', () => window.__keno_highlightRound(round));
  ```
- **Direct imports**: Most modules import functions from other modules via ES6 `import { fn } from './module.js'`

## Browser Extension Manifest (v3)

- Permissions: `storage` only (no network access granted to content script)
- Two content scripts run on Keno URLs: `https://stake.com/casino/games/keno*` and `https://stake.us/*`
- Interceptor runs at `document_start` (MAIN world); content at `document_idle` (ISOLATED world)
- Web accessible resources: `betbook.html`, `betbook.js` (for "Open Stats Book" button in overlay)

## Testing & Debugging Checklist

1. **Interceptor validation**: Open DevTools (Inspect → "Page" context), reload, verify console logs "KENO TRACKER" in blue and "✅ BET DATA FOUND!" on bet
2. **Message passing**: Add logs to message handler in `src/content.js`, verify hits/misses display after a round completes
3. **Build verification**: Run `npm run build`, check `dist/content.bundle.js` exists and has recent timestamp
4. **UI injection**: Button should appear in game footer; if missing, check if `.game-footer .stack` selector changed
5. **Storage**: `chrome.storage.local.get("history")` should return array; test reset clears all data
6. **Heatmap edge cases**: Empty history (no games), single game (avoid /0), switching modes mid-prediction
7. **URL scope**: Navigate away from keno page, verify overlay hides and no console errors
8. **Auto-play**: DISABLED for TOS compliance (feature removed from UI)
9. **Stats observer**: Check console for `[STATS] initStatsObserver called` and multiplier bar updates on tile clicks
10. **Module isolation**: Import errors show as "Cannot find module" - ensure all imports use relative paths (`./module.js`)
11. **Pattern caching**: Check console for "[patterns] Using cached data" on repeated queries; verify `window.__keno_clearPatternCache()` exists

## Common Pitfalls & Anti-Patterns

### 🚨 CRITICAL: Check CONTRIBUTING.md First!

**Before implementing any feature, consult `CONTRIBUTING.md` for:**

- Anti-patterns to avoid (setInterval, window globals, duplicates)
- Code quality standards and best practices
- Module organization and import patterns
- When ESLint exemptions are acceptable

### Architecture Anti-Patterns (Will Fail ESLint)

**1. Using `setInterval()` for state/DOM polling:**

- ❌ `setInterval(() => checkState(), 1000)` - Use events or MutationObserver
- ✅ `stateEvents.on(EVENTS.STATE_UPDATED, callback)` - Reactive
- ✅ `new MutationObserver(callback)` - DOM observation

**2. Accessing `window.__keno_*` in components:**

- ❌ `window.__keno_generateNumbers()` - Hidden dependency
- ✅ `import { generateNumbers } from './numberSelection.js'` - Explicit import

**3. Creating duplicate functions:**

- ❌ Copying existing function to new file
- ✅ Search codebase first: `grep -r "function name"` or semantic search
- ✅ Import from canonical location (usually `storage/` or `utils/`)

**4. Hardcoding values:**

- ❌ `backgroundColor: '#1a1b26'`, `padding: '12px'`, `maxRounds: 1000`
- ✅ `import { COLORS, PADDING, DEFAULTS } from './ui/constants/*'`

### Development Anti-Patterns

- **Message source validation**: Always check `event.source !== window` to filter external scripts
- **DOM assumptions**: Selectors may break on Stake UI updates; test after page changes
- **Storage timing**: `storage.local.get()` is async; ensure Promise resolution before DOM updates
- **Number offset**: Forgetting the +1 transform causes off-by-one mismatches between API and UI
- **Prediction mode conflicts**: Entering predict mode while heatmap active can cause layered highlights; `clearHighlight()` must restore to heatmap state
- **Module imports**: Always use relative paths with `.js` extension: `import { fn } from './module.js'`
- **Build after changes**: Must run `npm run build` after any `src/` file edits; browser only loads `dist/content.bundle.js`
- **State mutations**: Directly mutate `state` object properties; avoid creating new objects (breaks references)
- **Window hooks**: Functions exposed via `window.__keno_*` must be set in module's top-level scope, not inside functions
- **Observer timing**: `initStatsObserver()` retries if tiles container not found; don't call before DOM ready
- **Round data format**: New rounds need `drawn` and `selected` arrays for stats calculations; old format only had `hits`/`misses`
- **Pattern cache invalidation**: Always call `window.__keno_clearPatternCache()` in `saveRound()` to prevent stale data
- **Arbitrary delays**: NEVER use `setTimeout(fn, 200)` for DOM state - use MutationObserver or polling with actual state checks
- **Preview recursion**: `updateGeneratorPreview()` must NOT call `generateNumbers()` - call `generator.generate()` directly
- **Auto-save missing**: Every settings change event handler MUST call `saveGeneratorSettings()` or equivalent
- **Console log spam**: Remove verbose debug logs from production; keep only initialization, warnings, and errors

### DRY Principle Enforcement

**ALWAYS search before creating:**

1. Use semantic search or grep: `grep -r "similar function name"`
2. Check existing modules: `storage/`, `utils/`, `generators/`
3. Review constants: `src/ui/constants/*.js`
4. If found, import it; if not found, create in appropriate module

**Common duplicate locations to check:**

- `getDrawn()` → `storage/history.js` (canonical)
- `getHits()`, `getMisses()` → `storage/history.js`
- Color values → `src/ui/constants/colors.js`
- Padding/spacing → `src/ui/constants/styles.js`
- Default values → `src/ui/constants/defaults.js`

## Code Quality Standards

### Console Logging Policy (Dec 2024)

**CRITICAL: console.warn is for WARNINGS, NOT for debugging!**

ESLint allows `console.warn` and `console.error`, but they have specific purposes:

- ✅ `console.warn` - Production warnings (timeouts, fallbacks, non-critical issues)
- ✅ `console.error` - Real errors only
- ❌ `console.log` - BLOCKED by ESLint
- ❌ `console.info` - BLOCKED
- ❌ `console.debug` - BLOCKED

**Correct usage of console.warn:**

```javascript
// ✅ Good - actual warning about problematic state
console.warn("[Utils] Bet button timeout, using fallback");

// ❌ Bad - using warn to bypass linting for debug logs
console.warn("[Preview Debug] Last round:", lastRound);
console.warn("[Preview Debug] Matches found:", hits);
```

**Keep**:

- Critical initialization logs with suppression:
  ```javascript
  // eslint-disable-next-line no-console
  console.log("[Extension] Keno Tracker loaded");
  ```
- Real warnings: `console.warn('[Utils] Bet button timeout')`
- Real errors: `console.error('[Generator] Failed to generate:', error)`

**Remove**:

- Debug logs disguised as warnings (any log with "Debug" in the message)
- Cache status logs that execute every generation
- "Called with..." logs on every function invocation
- Selection/tile operation details
- Settings change confirmations
- Any log that executes more than once per minute in normal usage

**For temporary debugging**:

1. Use `console.log` locally (ESLint will flag it)
2. Remove ALL debug logs before committing
3. **NEVER use `console.warn` to bypass linting** - this defeats the entire purpose
4. Never suppress console.log with `eslint-disable-next-line` unless it's a critical initialization log

**Rationale**: Console should show initialization flow, warnings about non-ideal states, and real errors - not verbose operational details or debug spam.

### Function Documentation

All public functions must have JSDoc comments:

```javascript
/**
 * Generate predictions using the active generator method
 * @param {boolean} forceRefresh - Skip cache and generate fresh predictions
 * @returns {Object} { predictions: number[], method: string }
 */
export function generateNumbers(forceRefresh = false) {
  // Implementation
}
```

**Required fields**: Description, `@param` for each parameter, `@returns` for return value.

### Module Organization

**Pattern**: Group related functionality into classes or modules with clear single responsibility

**Good**:

```javascript
// cache.js - CacheManager handles all caching logic
export class CacheManager {
  get(key) {
    /* ... */
  }
  set(key, value) {
    /* ... */
  }
  clear() {
    /* ... */
  }
}
```

**Bad**:

```javascript
// mixed responsibilities in one file
export function generateNumbers() {
  /* ... */
}
export function cacheNumbers() {
  /* ... */
}
export function selectTiles() {
  /* ... */
}
export function updateUI() {
  /* ... */
}
```

### Timing and DOM Operations

**Always use observation patterns for DOM state**:

```javascript
// ✅ Good - observes actual state
export function waitForBetButtonReady() {
  return new Promise((resolve, reject) => {
    const observer = new MutationObserver(() => {
      if (betButton.getAttribute("data-test-action-enabled") === "true") {
        observer.disconnect();
        resolve();
      }
    });
    observer.observe(betButton, { attributes: true });
  });
}

// ❌ Bad - arbitrary delay
export function waitForBetButtonReady() {
  return new Promise((resolve) => {
    setTimeout(resolve, 200); // Hope it's ready by then?
  });
}
```

**Polling acceptable for state checks** (not available via MutationObserver):

```javascript
const checkCleared = () => {
  const tiles = getAllTiles();
  const anySelected = tiles.some(isTileSelected);
  if (!anySelected) resolve();
  else setTimeout(checkCleared, 50); // Poll every 50ms
};
```

## Auto-Play Feature Status

**DISABLED for TOS compliance** (December 2024)

The auto-play feature has been disabled to comply with Stake.com Terms of Service Section 5.1(y) which prohibits "software-assisted methods" for game participation. The automated betting functionality was determined to be the highest risk for TOS violation.

**Code location**: All auto-play code is commented out (not deleted) in:

- `src/ui/overlay.js` - UI section and event handlers
- `src/content.js` - Execution logic and timer
- `src/features/autoplay.js` - Core betting functions (file still exists but unused)

**To re-enable** (if TOS interpretation changes): Uncomment the marked sections in the files above.

**Remaining features are defensible** as decision support tools that require manual user action for each bet.
