# Keno Tracker Browser Extension - AI Coding Instructions

## Architecture Overview

This is a Chrome/Firefox browser extension that tracks Keno game statistics on Stake.com. It operates across **two isolated security worlds** with distinct responsibilities:

- **`interceptor.js` (MAIN world)**: Intercepts `fetch()` calls at page startup (`document_start`) to extract live game data from GraphQL responses
- **`src/` modules (ISOLATED world)**: Modular ES6 codebase bundled via esbuild into `dist/content.bundle.js` for the extension sandbox
- **Data Flow**: `interceptor.js` → `window.postMessage()` → `src/content.js` → Module functions → Chrome storage API

### Module Architecture (src/)

Code split across specialized modules:

- **`content.js`**: Entry point, message listener, initialization orchestration, auto-play round management
- **`state.js`**: Centralized reactive state (`currentHistory`, `isPredictMode`, `isAutoPlayMode`, `sampleSize`, etc.)
- **`overlay.js`**: UI overlay creation, event binding, toggle button injection into game footer
- **`heatmap.js`**: Frequency analysis, tile highlighting (hits/misses/predictions), percentage badge rendering
- **`autoplay.js`**: Prediction algorithm (top N by frequency), auto-play betting logic, UI updates
- **`storage.js`**: Chrome/Firefox storage API abstraction, history CRUD, UI sync after saves
- **`stats.js`**: Multiplier bar integration, probability calculation, MutationObserver for tile selection
- **`patterns.js`**: Pattern analysis to find common number combinations appearing with a target number
- **`utils.js`**: DOM helpers (`simulatePointerClick`, `findAndClickPlayButton`)

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

Critical safety check: Functions in `overlay.js` verify `window.location.href.includes("keno")` before DOM manipulation:

- If not on Keno page: removes injected buttons, hides overlay, exits early via `injectFooterButton()`
- Prevents errors on non-Keno game pages within Stake.com

### 3. Number Transformation (Keno-Specific)

Stake API returns 0-39 indices; UI displays 1-40 board:

```javascript
const drawn = rawDrawn.map((n) => n + 1); // Always add 1 from API
```

This offset is applied in `content.js` after message receipt. Tests should verify this transformation.

### 4. Storage Abstraction (`storage.js`)

Supports both Chrome and Firefox via conditional API selection:

```javascript
const storageApi = typeof browser !== "undefined" ? browser : chrome;
```

- History stored as **unlimited** array (changed from 100-round cap for bet book feature)
- `saveRound()` automatically triggers `updateHistoryUI()` and heatmap refresh via callbacks
- Round format: `{ hits, misses, drawn, selected, time }`

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
- **Auto-Play Mode (Planned)**: Extension will automatically play X rounds using prediction algorithm to make strategic guesses based on heatmap frequency analysis

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

- **`findCommonPatterns(patternSize, topN)`**: Generates all combinations of patternSize numbers from drawn results, ranks by frequency
- **`getPatternStats(patternSize)`**: Calculates total unique patterns and average appearance rate for given size
- **`showPatternAnalysisModal(patternSize)`**: Displays modal UI with top 15 patterns and statistics
- Uses combination algorithm to find all possible N-number sets that appeared together in the 20 drawn numbers
- Example: Size 5 finds which 5-number combinations (like [3, 12, 18, 25, 37]) appeared together most often

## Selector & DOM Queries

All game tiles queried via: `document.querySelector('div[data-testid="keno-tiles"]')`
Footer button injection point: `document.querySelector('.game-footer .stack')`

**Assumption**: Stake's Keno UI maintains these selectors. If breaking, check inspector and update selectors accordingly.

## Build System & Development Workflow

### Build Commands (package.json)

- **`npm run build`**: Bundles `src/content.js` → `dist/content.bundle.js` with esbuild (minified, sourcemap)
- **`npm run watch`**: Development mode with hot reload (no minification)
- **esbuild config**: `--bundle --platform=browser` treats all `src/*.js` imports as ES6 modules

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
8. **Auto-play simulation**: Verify prediction algorithm ranks numbers correctly and round count decrements properly
9. **Stats observer**: Check console for `[STATS] initStatsObserver called` and multiplier bar updates on tile clicks
10. **Module isolation**: Import errors show as "Cannot find module" - ensure all imports use relative paths (`./module.js`)

## Common Pitfalls & Anti-Patterns

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

## Strategic Guessing Implementation Notes

When implementing auto-play functionality:

- **Betting logic**: Use `calculatePrediction()` to generate top N numbers; click tiles via `simulatePointerClick()` from `utils.js`
- **Round counter**: Track remaining rounds in `state.autoPlayRoundsRemaining`; decremented in `content.js` message listener
- **Bet confirmation**: Wait 1500ms after round detected before placing next bet (timing in `content.js` auto-play handler)
- **Fallback strategy**: Use `generateRandomPrediction()` from `autoplay.js` if insufficient history (< 5 games)
- **UI updates**: Call `updateAutoPlayUI()` after any state change to sync button text and status display
- **Play button**: Find via `data-testid="bet-button"` selector (see `findAndClickPlayButton()` in `utils.js`)
