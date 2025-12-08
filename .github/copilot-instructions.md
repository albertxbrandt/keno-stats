# Keno Tracker Browser Extension - AI Coding Instructions

## Architecture Overview

This is a Chrome/Firefox browser extension that tracks Keno game statistics on Stake.com. It operates across **two isolated security worlds** with distinct responsibilities:

- **`interceptor.js` (MAIN world)**: Intercepts `fetch()` calls at page startup (`document_start`) to extract live game data from GraphQL responses
- **`content.js` (ISOLATED world)**: Runs in the extension sandbox, manages all UI, storage, analytics, and game state
- **Data Flow**: `interceptor.js` → `window.postMessage()` → `content.js` → Chrome storage API

## Critical Implementation Patterns

### 1. Cross-World Communication (Message Passing)
Messages flow one direction: Page → Extension sandbox via `window.postMessage()`:
```javascript
// interceptor.js sends:
window.postMessage({ type: "KENO_DATA_FROM_PAGE", payload: { drawnNumbers, selectedNumbers } }, "*");

// content.js listens:
window.addEventListener("message", (event) => {
    if (event.source !== window || event.data.type !== "KENO_DATA_FROM_PAGE") return;
    // Process data...
});
```
**Key insight**: The source check prevents external scripts from spoofing messages. Only `window.postMessage()` bypasses same-origin, not cross-origin requests.

### 2. URL-Scoped Functionality
Critical safety check: Functions must verify `window.location.href.includes("keno")` before DOM manipulation. Example in `injectFooterButton()`:
- If not on Keno page: removes injected buttons, hides overlay, exits early
- Prevents errors on non-Keno game pages within Stake.com

### 3. Number Transformation (Keno-Specific)
Stake API returns 0-39 indices; UI displays 1-40 board:
```javascript
const drawn = rawDrawn.map(n => n + 1);  // Always add 1 from API
```
This offset is applied in `content.js` after message receipt. Tests should verify this transformation.

### 4. Storage Abstraction
Supports both Chrome and Firefox via conditional API selection:
```javascript
const storage = (typeof browser !== 'undefined') ? browser : chrome;
```
History stored as array, capped at 100 rounds (FIFO oldest-first eviction).

## Key Components & Patterns

### Game Data Extraction (interceptor.js)
- Safeguard: `if (!window.kenoInterceptorActive)` prevents multiple injections
- Intercepts URLs matching `graphql` or `bet`
- Handles two JSON response paths: `data.kenoBet.state` or direct `kenoBet.state`
- Extracts: `drawnNumbers`, `selectedNumbers` from `state` object
- Console logs for debugging: styled green (`%c ✅ BET DATA FOUND!`) on success, errors on parse failure

### Round Data Structure
```javascript
{ hits: [1,5,12,...], misses: [3,7,18,...], time: Date.now() }
```
- `hits`: selected numbers that were drawn
- `misses`: drawn numbers not in selection
- Both sorted ascending; used in heatmap % calculations

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
const topPicks = sorted.slice(0, count).map(entry => parseInt(entry[0]));
```

## Selector & DOM Queries

All game tiles queried via: `document.querySelector('div[data-testid="keno-tiles"]')`
Footer button injection point: `document.querySelector('.game-footer .stack')`

**Assumption**: Stake's Keno UI maintains these selectors. If breaking, check inspector and update selectors accordingly.

## Browser Extension Manifest (v3)
- Permissions: `storage` only (no network access granted to content script)
- Two content scripts run on Keno URLs: `https://stake.com/casino/games/keno*` and `https://stake.us/*`
- Interceptor runs at `document_start` (MAIN world); content at `document_idle` (ISOLATED world)

## Testing & Debugging Checklist
1. **Interceptor validation**: Open DevTools (Inspect → "Page" context), reload, verify console logs "KENO TRACKER" in blue and "✅ BET DATA FOUND!" on bet
2. **Message passing**: Add logs to message handler in content.js, verify hits/misses display after a round completes
3. **UI injection**: Button should appear in game footer; if missing, check if `.game-footer .stack` selector changed
4. **Storage**: `chrome.storage.local.get("history")` should return array; test reset clears all data
5. **Heatmap edge cases**: Empty history (no games), single game (avoid /0), switching modes mid-prediction
6. **URL scope**: Navigate away from keno page, verify overlay hides and no console errors
7. **Auto-play simulation**: Verify prediction algorithm ranks numbers correctly and round count decrements properly

## Strategic Guessing Implementation Notes

When implementing auto-play functionality:
- **Betting logic**: Use `calculatePrediction()` to generate top N numbers; click tiles and submit bet via DOM events or fetch intercept
- **Round counter**: Track remaining rounds to play; decrement after each completed round detected via message listener
- **Bet confirmation**: Monitor game state to detect when round completes before submitting next bet
- **Fallback strategy**: If insufficient history (< 5 games), use random selection or uniform distribution across board
- **Message source validation**: Always check `event.source !== window` to filter external scripts
- **DOM assumptions**: Selectors may break on Stake UI updates; test after page changes
- **Storage timing**: `storage.local.get()` is async; ensure Promise resolution before DOM updates
- **Number offset**: Forgetting the +1 transform causes off-by-one mismatches between API and UI
- **Prediction mode conflicts**: Entering predict mode while heatmap active can cause layered highlights; `clearHighlight()` must restore to heatmap state
