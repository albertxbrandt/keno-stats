# Keno Stats Extension - Developer Guide

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Project Structure](#project-structure)
3. [Core Concepts](#core-concepts)
4. [Module Reference](#module-reference)
5. [Data Flow](#data-flow)
6. [Adding Features](#adding-features)
7. [Testing & Debugging](#testing--debugging)
8. [Best Practices](#best-practices)

---

## Architecture Overview

### Two-World System

The extension operates across two isolated JavaScript execution contexts:

#### 1. MAIN World (`interceptor.js`)

- **Purpose**: Intercept page-level fetch() calls
- **Access**: Full page DOM, can modify native APIs
- **Restrictions**: Cannot use Chrome extension APIs
- **Runs at**: `document_start` (before page scripts)

#### 2. ISOLATED World (`src/` modules)

- **Purpose**: Extension logic, UI, storage
- **Access**: Chrome extension APIs, isolated DOM
- **Restrictions**: Cannot access page variables
- **Runs at**: `document_idle` (after DOM ready)

### Communication Flow

```
[Page] → fetch() → [MAIN: interceptor.js]
           ↓
    Intercepts GraphQL response
           ↓
    window.postMessage() → [ISOLATED: content.js]
           ↓
    Process data → Update UI → Store in Chrome storage
```

### Security Boundaries

- **MAIN world**: Can intercept but has no storage access
- **ISOLATED world**: Has storage but cannot intercept page calls
- **Message validation**: Always check `event.source === window`

---

## Project Structure

```
keno-stats/
├── src/                      # Source code (ES6 modules)
│   ├── core/                 # State and storage
│   │   ├── state.js          # Global reactive state
│   │   └── storage.js        # Chrome storage API wrapper
│   ├── features/             # Feature modules
│   │   ├── heatmap.js        # Board statistics overlay
│   │   ├── patterns.js       # Pattern analysis
│   │   ├── autoplay.js       # Auto-betting system
│   │   ├── profitLoss.js     # Profit tracking
│   │   ├── comparison.js     # Method comparison
│   │   └── savedNumbers.js   # Saved sets
│   ├── generators/           # Number generation strategies
│   │   ├── index.js          # Factory and registry
│   │   ├── cache.js          # Universal cache manager
│   │   ├── base.js           # Base generator class
│   │   ├── frequency.js      # Hot numbers
│   │   ├── cold.js           # Cold numbers
│   │   ├── mixed.js          # Hot + cold
│   │   ├── average.js        # Median frequency
│   │   ├── momentum.js       # Trend detection
│   │   ├── shapes.js         # Shape wrapper
│   │   └── shapesCore.js     # Shape definitions
│   ├── ui/                   # User interface
│   │   ├── overlay.js        # Main UI panel
│   │   └── numberSelection.js # Generator coordination
│   ├── utils/                # Utilities
│   │   ├── utils.js          # DOM helpers
│   │   ├── domReader.js      # State reading
│   │   ├── tileSelection.js  # Board interaction
│   │   └── stats.js          # Multiplier bar
│   └── content.js            # Entry point
├── interceptor.js            # Page-level interception
├── background.js             # Service worker
├── manifest.json             # Extension manifest (v3)
├── eslint.config.mjs         # Linting config
├── package.json              # Dependencies
├── dist/                     # Build output
│   └── content.bundle.js     # Bundled code
└── docs/                     # Documentation
    ├── USER_GUIDE.md         # User documentation
    └── DEVELOPER_GUIDE.md    # This file
```

---

## Core Concepts

### State Management

**Global State** (`src/core/state.js`):

```javascript
export const state = {
  currentHistory: [], // All game rounds
  isHeatmapActive: true, // Feature toggles
  heatmapMode: "hot", // hot | trending
  generatorMethod: "frequency",
  generatorCount: 3,
  // ... 50+ properties
};
```

**Key Principles**:

- Single source of truth
- Direct mutation (no setters/getters)
- All modules import and modify same object
- Reactive updates via callbacks

### Storage System

**Chunked Storage** (`src/core/storage.js`):

```javascript
// Avoids rewriting entire history on each round
const CHUNK_SIZE = 1000; // 1000 rounds per chunk
function getChunkKey(index) {
  return `history_chunk_${Math.floor(index / CHUNK_SIZE)}`;
}
```

**Benefits**:

- Fast writes (only updates one chunk)
- Handles unlimited history
- Avoids Chrome storage quota issues (chunks < 8KB each)

**API Functions**:

- `saveRound(round)`: Append to history
- `loadHistory()`: Load all chunks
- `clearHistory()`: Delete all chunks
- `saveGeneratorSettings()`: Persist config
- `loadGeneratorSettings()`: Restore config

### Generator System

**Factory Pattern** (`src/generators/index.js`):

```javascript
import { generatorFactory } from "./generators/index.js";

const generator = generatorFactory.get("frequency");
const predictions = generator.generate(count, history, config);
```

**Base Class** (`src/generators/base.js`):

```javascript
export class BaseGenerator {
  generate(count, history, config) {
    // Override in subclass
  }

  selectSample(history, sampleSize) {
    return history.slice(-sampleSize);
  }

  countFrequency(sample) {
    // Count number occurrences
  }
}
```

**Cache Manager** (`src/generators/cache.js`):

- Universal refresh interval logic
- Key: `${method}-${count}-${JSON.stringify(config)}`
- Validates: `currentRound - generatorLastRefresh < interval`
- Manual mode (interval=0): cache never expires

### DOM Interaction

**Observation Pattern** (`src/utils/utils.js`):

```javascript
export function waitForBetButtonReady(maxWaitMs = 5000) {
  return new Promise((resolve, reject) => {
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
  });
}
```

**Key Principle**: Never use arbitrary `setTimeout()` - always observe actual state

---

## Module Reference

### Core Modules

#### `state.js`

**Purpose**: Global application state  
**Exports**: `state` object  
**Usage**: `import { state } from './core/state.js'`

**Key Properties**:

- `currentHistory`: Array of rounds
- `isHeatmapActive`, `heatmapMode`: Heatmap settings
- `generatorMethod`, `generatorCount`, `generatorInterval`: Generator config
- `generatorLastRefresh`: Tracks refresh timing
- `isAutoPlayMode`, `autoPlayRoundsRemaining`: Auto-play state

#### `storage.js`

**Purpose**: Chrome storage API wrapper with chunking  
**Exports**: CRUD functions for history and settings

**Key Functions**:

```javascript
export function saveRound(round)         // Append to history
export function loadHistory()            // Load all chunks
export function clearHistory()           // Delete all data
export function saveGeneratorSettings()  // Persist config
export function loadGeneratorSettings()  // Restore config
export function saveHeatmapSettings()    // Persist heatmap
export function loadHeatmapSettings()    // Restore heatmap
```

### Feature Modules

#### `heatmap.js`

**Purpose**: Display statistics on Keno board tiles

**Key Functions**:

```javascript
export function updateHeatmap()         // Refresh all tiles
export function highlightRound(round)   // Show specific round
export function clearHighlight()        // Remove overlays
```

**Algorithm (Hot Mode)**:

```javascript
counts[num] = appearances / totalGames;
display = (count * 100).toFixed(0) + "%";
```

**Algorithm (Trending Mode)**:

```javascript
recentRate = recentCount / recentWindow;
baselineRate = baselineCount / baselineWindow;
momentum = recentRate / baselineRate;
display = momentum.toFixed(1) + "x";
```

**Thresholds**:

- Hot: Green ≥30%, Red ≤10%
- Trending: Green ≥1.2x, Red ≤0.8x

#### `patterns.js`

**Purpose**: Find common N-number combinations

**Algorithm**:

1. Generate all C(40, N) combinations
2. Check which appear in drawn results
3. Count occurrences for each combination
4. Rank by frequency
5. Cache results for 5 minutes

**Performance**:

- Uses combinatorial math library
- Async processing with setTimeout
- Caching system with TTL
- Global hook: `window.__keno_clearPatternCache()`

#### `autoplay.js`

**Purpose**: Automated betting system

**Flow**:

1. Check if auto-play active
2. Generate numbers via active method
3. Wait for bet button ready (`waitForBetButtonReady`)
4. Apply numbers to board
5. Click bet button
6. Decrement rounds counter
7. Update UI
8. Repeat

**Safety**: Uses DOM observation, not arbitrary delays

### Generator Modules

#### `base.js`

**Purpose**: Shared functionality for all generators

**Provides**:

```javascript
selectSample(history, size); // Get last N rounds
countFrequency(sample); // Count appearances
sortByFrequency(counts); // Rank numbers
selectRandom(numbers, count); // Random selection
```

#### `cache.js`

**Purpose**: Universal caching and refresh logic

**Logic**:

```javascript
get(method, count, state, config) {
    const cached = this.cache.get(key);
    if (!cached) return null;

    const interval = state.generatorInterval;
    if (interval === 0) return cached.predictions; // Manual

    const roundsSince = currentRound - state.generatorLastRefresh;
    return roundsSince < interval ? cached.predictions : null;
}
```

#### Individual Generators

**frequency.js**: Top N most frequent numbers  
**cold.js**: Bottom N least frequent numbers  
**mixed.js**: Combination of hot and cold  
**average.js**: Median frequency numbers  
**momentum.js**: Numbers with increasing frequency  
**shapes.js**: Geometric patterns with smart placement

### UI Modules

#### `overlay.js`

**Purpose**: Main extension UI panel

**Responsibilities**:

- Create overlay HTML structure
- Bind event listeners
- Load/save settings
- Coordinate feature panels
- Handle drag-and-drop reordering

**Key Functions**:

```javascript
export function createOverlay()      // Build UI
export function initOverlay()        // Initialize
export function injectFooterButton() // Add toggle button
```

#### `numberSelection.js`

**Purpose**: Generator coordination layer

**Key Functions**:

```javascript
export function generateNumbers(forceRefresh)  // Main entry point
export function updateGeneratorPreview()       // Live preview
export function selectPredictedNumbers()       // Apply to board
export function generateAllPredictions()       // For comparison
```

---

## Data Flow

### Round Processing Pipeline

```
1. User places bet on Stake
      ↓
2. [interceptor.js] Intercepts fetch response
      ↓
3. Extracts drawnNumbers, selectedNumbers
      ↓
4. window.postMessage({ type: 'KENO_DATA_FROM_PAGE', payload })
      ↓
5. [content.js] Receives message
      ↓
6. Calculates hits/misses
      ↓
7. Saves to state.currentHistory
      ↓
8. Writes to chunked storage
      ↓
9. Updates UI (history panel, heatmap, stats)
      ↓
10. Triggers generator refresh (if interval met)
      ↓
11. Auto-play places next bet (if active)
```

### Generator Refresh Flow

```
1. generateNumbers() called
      ↓
2. Check cache via cacheManager.get()
      ↓
3. If valid cache → return cached predictions
      ↓
4. If expired/missing → generate fresh
      ↓
5. generator.generate(count, history, config)
      ↓
6. Store in cache via cacheManager.set()
      ↓
7. Update state.generatedNumbers
      ↓
8. Update state.generatorLastRefresh = currentRound
      ↓
9. Apply to board (if auto-select enabled)
      ↓
10. Update preview UI
```

### Settings Persistence

```
1. User changes setting in UI
      ↓
2. Event listener updates state object
      ↓
3. Calls saveGeneratorSettings() or saveHeatmapSettings()
      ↓
4. Chrome storage API writes to local storage
      ↓
5. On next load: loadSettings() → restores state
```

---

## Adding Features

### Adding a New Generator Method

1. **Create generator file** (`src/generators/mymethod.js`):

```javascript
import { BaseGenerator } from "./base.js";

export class MyMethodGenerator extends BaseGenerator {
  generate(count, history, config) {
    const sample = this.selectSample(history, config.sampleSize);

    // Your algorithm here
    const numbers = this.myAlgorithm(sample);

    return numbers.slice(0, count);
  }

  myAlgorithm(sample) {
    // Implement your logic
  }
}
```

2. **Register in factory** (`src/generators/index.js`):

```javascript
import { MyMethodGenerator } from "./mymethod.js";

generatorFactory.register("mymethod", new MyMethodGenerator());
```

3. **Add to UI** (`src/ui/overlay.js`):

```html
<option value="mymethod">🆕 My Method</option>
```

4. **Update method names map** (`src/ui/numberSelection.js`):

```javascript
const methodNames = {
  mymethod: "🆕 My Method",
  // ...
};
```

### Adding a Feature Module

1. **Create module file** (`src/features/myfeature.js`):

```javascript
import { state } from "../core/state.js";

export function initMyFeature() {
  // Setup logic
}

export function updateMyFeature() {
  // Update logic
}

// Expose to window for cross-module access
window.__keno_updateMyFeature = updateMyFeature;
```

2. **Import in content.js**:

```javascript
import { initMyFeature, updateMyFeature } from "./features/myfeature.js";
```

3. **Initialize in content.js**:

```javascript
function initializeExtension() {
  // ...
  initMyFeature();
}
```

4. **Add UI section** (`src/ui/overlay.js`):

```html
<div data-section="myfeature" style="...">
  <!-- Your UI here -->
</div>
```

### Adding State Properties

1. **Define in state.js**:

```javascript
export const state = {
  // ...
  myFeatureEnabled: false,
  myFeatureSetting: 10,
};
```

2. **Save/load settings** (`src/core/storage.js`):

```javascript
export function saveMyFeatureSettings() {
  const settings = {
    myFeatureEnabled: state.myFeatureEnabled,
    myFeatureSetting: state.myFeatureSetting,
  };
  storageApi.storage.local.set({ myFeatureSettings: settings });
}
```

3. **Bind to UI** (`src/ui/overlay.js`):

```javascript
myFeatureToggle.addEventListener("change", () => {
  state.myFeatureEnabled = getCheckboxValue(myFeatureToggle);
  saveMyFeatureSettings();
  updateMyFeature();
});
```

---

## Testing & Debugging

### Development Workflow

```bash
# Install dependencies
npm install

# Development mode (watch)
npm run watch

# Build for production
npm run build

# Check code quality
npm run lint

# Auto-fix linting issues
npm run lint:fix
```

### Loading in Browser

**Chrome**:

1. Go to `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select the project folder
5. Reload extension after each build

**Firefox**:

1. Go to `about:debugging#/runtime/this-firefox`
2. Click "Load Temporary Add-on"
3. Select `manifest.json`
4. Reload after each build

### Debugging Tools

#### Console Contexts

**Page Console** (F12 → Console → select "Page"):

- See interceptor.js logs
- MAIN world context
- Styled logs: `%c KENO TRACKER`

**Extension Console** (F12 → Console → select extension):

- See content.js and module logs
- ISOLATED world context
- Prefixed logs: `[Keno Tracker]`, `[Generator]`, etc.

#### Key Log Messages

```javascript
// Interceptor
console.log('%c ✅ BET DATA FOUND!', ...)  // Successful interception

// Content
console.log('[KENO] Round received:', ...)  // Data processed
console.log('[Generator] Using cached predictions')  // Cache hit
console.log('[Generator] Generated fresh predictions')  // Fresh generation

// Heatmap
console.log('[Heatmap] Updating...')  // Refresh triggered

// Auto-play
console.log('[AutoPlay] Starting...')  // Auto-play initiated
console.log('[AutoPlay] Placing bet')  // Bet placed
```

#### Chrome DevTools

**Storage Inspector**:

- Application → Storage → Local Storage
- Extension ID → `history_count`, `history_chunk_0`, etc.

**Network Tab**:

- Filter by "graphql" or "bet"
- Check interceptor is capturing responses

**Elements Tab**:

- Inspect overlay structure
- Check heatmap overlays on tiles
- Verify data attributes

### Common Issues

**Extension not loading**:

- Check manifest.json syntax
- Verify all files exist
- Run `npm run build` first
- Check browser console for errors

**Interceptor not working**:

- Verify `world: "MAIN"` in manifest
- Check if multiple extensions interfering
- Look for `kenoInterceptorActive` flag in page console

**UI not updating**:

- Check if callbacks registered: `window.__keno_updateHeatmap`
- Verify state changes with console logs
- Ensure event listeners bound

**Generator always refreshing**:

- Check `generatorLastRefresh` value
- Verify interval setting
- Look at cache key in console

**Performance slow**:

- Check history size (clear old data)
- Disable features not in use
- Use profiler to find bottlenecks

---

## Best Practices

### Code Style

**ESLint Rules**:

- No unused variables (prefix with `_` if intentional)
- Console allowed (needed for debugging)
- Browser + webextensions globals

**Example**:

```javascript
// ✅ Good - unused param marked
array.map((_item, index) => index);

// ✅ Good - ignored error
try { ... } catch (_e) { /* intentional ignore */ }

// ❌ Bad - unused variable
const result = getData();  // Never used
```

### Performance

**DOM Operations**:

- Batch updates where possible
- Use `requestAnimationFrame` for animations
- Debounce frequent updates
- Cache DOM queries

**Storage**:

- Use chunked writes
- Debounce saves (100ms in queueStorageWrite)
- Only store necessary data
- Clear old data periodically

**Generators**:

- Use caching system
- Avoid regenerating every round
- Sample size affects performance
- Cache pattern analysis results

### Timing & State

**Never use arbitrary delays**:

```javascript
// ❌ Bad
setTimeout(() => clickButton(), 500);

// ✅ Good
waitForBetButtonReady().then(() => clickButton());
```

**Always observe actual state**:

```javascript
// ✅ Good - MutationObserver
const observer = new MutationObserver(() => {
  if (actualCondition) {
    /* proceed */
  }
});

// ✅ Good - Polling with condition check
function waitForElement() {
  if (elementExists()) resolve();
  else setTimeout(waitForElement, 100);
}
```

### Module Communication

**Prefer direct imports**:

```javascript
import { updateHeatmap } from "./features/heatmap.js";
updateHeatmap();
```

**Use window hooks for cross-context**:

```javascript
// In heatmap.js
window.__keno_updateHeatmap = updateHeatmap;

// In HTML string (overlay.js)
onclick = "window.__keno_updateHeatmap()";
```

**State as single source**:

```javascript
// ✅ Good
import { state } from "./core/state.js";
state.isHeatmapActive = true;

// ❌ Bad - local copy
let isHeatmapActive = true;
```

### Error Handling

**Try-catch for external calls**:

```javascript
try {
  updateHistoryUI();
} catch (e) {
  console.warn("[content] updateHistoryUI failed", e);
}
```

**Promise error handling**:

```javascript
loadHistory()
  .then(() => {
    /* success */
  })
  .catch((e) => {
    console.error("[storage] load failed", e);
  });
```

**Validation**:

```javascript
if (!window.location.href.includes("keno")) return;
if (!state.currentHistory.length) return;
if (!container) return;
```

### Documentation

**JSDoc for public functions**:

```javascript
/**
 * Generate predictions using active generator method
 * @param {boolean} forceRefresh - Skip cache and regenerate
 * @returns {Object} { predictions: number[], cached: boolean }
 */
export function generateNumbers(forceRefresh = false) {
  // ...
}
```

**Inline comments for complex logic**:

```javascript
// Calculate momentum: recent frequency / baseline frequency
// >1.0 = trending up, <1.0 = trending down
const momentum = recentRate / baselineRate;
```

**README updates**:

- Document new features
- Update installation steps
- Add troubleshooting tips

---

## Architecture Decisions

### Why Two Worlds?

**Security**: Chrome extensions cannot modify page-level JavaScript. The MAIN world interceptor runs as if it's part of the page, allowing fetch() interception, while the ISOLATED world provides secure storage and UI.

### Why Chunked Storage?

**Scalability**: Chrome storage has 8KB per item limit. Single array would hit this quickly. Chunking allows unlimited history.

### Why Cache Manager?

**Consistency**: All generators use same refresh logic. Avoids duplicating interval checking in each generator.

### Why Base Generator Class?

**DRY Principle**: Shared utilities (sample selection, frequency counting) used by all generators.

### Why MutationObserver?

**Reliability**: Arbitrary delays (setTimeout) are unreliable. Observing actual state changes ensures timing correctness.

---

## Future Enhancements

### Potential Features

- Machine learning predictions
- Advanced pattern recognition
- Multi-game support
- Cloud sync
- Strategy marketplace
- A/B testing system

### Code Improvements

- TypeScript migration
- Unit test coverage
- E2E testing with Playwright
- CI/CD pipeline
- Automated releases

### Performance

- Web Workers for heavy computation
- IndexedDB for larger datasets
- Service Worker improvements
- Lazy loading modules

---

## Contributing

### Workflow

1. Fork the repository
2. Create feature branch: `git checkout -b feature/my-feature`
3. Make changes
4. Run linter: `npm run lint`
5. Build: `npm run build`
6. Test thoroughly
7. Commit: `git commit -m "Add my feature"`
8. Push: `git push origin feature/my-feature`
9. Create Pull Request

### Commit Messages

Format: `<type>: <description>`

Types:

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `refactor`: Code restructuring
- `perf`: Performance improvement
- `test`: Testing
- `chore`: Maintenance

Examples:

- `feat: Add trending heatmap mode`
- `fix: Generator refresh interval logic`
- `docs: Update user guide with momentum multipliers`

### Code Review Checklist

- [ ] Follows ESLint rules
- [ ] No console.log spam (only init/warnings/errors)
- [ ] Functions documented with JSDoc
- [ ] No arbitrary setTimeout delays
- [ ] State properly managed
- [ ] Settings saved/loaded
- [ ] UI updates on state changes
- [ ] Error handling implemented
- [ ] Performance considered
- [ ] Tested in browser

---

**Last Updated**: December 19, 2024  
**Version**: 1.0  
**For**: Keno Stats Extension
