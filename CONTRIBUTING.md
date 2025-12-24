# Contributing Guidelines

## Code Quality Standards

This project maintains strict code quality standards to ensure maintainability and prevent technical debt. These guidelines apply to both human and AI-generated code.

---

## 🚫 Anti-Patterns to Avoid

### 1. Polling with `setInterval()`

**❌ BAD:**

```javascript
// Polling every second - inefficient!
setInterval(() => {
  checkForUpdates();
}, 1000);
```

**✅ GOOD:**

```javascript
// Event-driven - updates only when data changes
stateEvents.on(EVENTS.DATA_UPDATED, () => {
  handleUpdate();
});

// Or use MutationObserver for DOM changes
const observer = new MutationObserver(() => {
  handleDOMChange();
});
observer.observe(element, { attributes: true });
```

**When polling is acceptable:**

- State variables in components (e.g., `const [updateInterval, setUpdateInterval] = useState(5)`)
- Never for checking state or DOM changes

**ESLint will catch:** `setInterval()` function calls (exempted in specific files where legitimate)

---

### 2. Window Globals (`window.__keno_*`)

**❌ BAD:**

```javascript
// Component accessing functions via window globals
const handleClick = () => {
  if (window.__keno_generateNumbers) {
    window.__keno_generateNumbers();
  }
};
```

**✅ GOOD:**

```javascript
// Direct import from module
import { generateNumbers } from "../numberSelection.js";

const handleClick = () => {
  generateNumbers();
};
```

**When window globals are acceptable:**

- `src/content.js` - Message listener needs `window.__keno_state` for cross-context communication
- `src/bridges/windowGlobals.js` - Intentional bridge module for legacy compatibility
- `src/ui/numberSelection.js` - Exports functions to window for content.js message listener only

**ESLint will catch:** Window global usage (exempted in bridge files only)

**Why this matters:**

- Hidden dependencies make code hard to understand
- No IDE autocomplete or type checking
- Refactoring becomes error-prone
- Can't track what depends on what

---

### 3. Duplicate Functions

**❌ BAD:**

```javascript
// File A
function getDrawn() {
  return state.currentHistory.map((r) => r.drawn);
}

// File B (duplicate!)
function getDrawn() {
  return state.currentHistory.map((r) => r.drawn);
}
```

**✅ GOOD:**

```javascript
// storage/history.js (single source of truth)
export function getDrawn() {
  return state.currentHistory.map((r) => r.drawn);
}

// Other files
import { getDrawn } from "./storage/history.js";
```

**Before creating a new function:**

1. Search codebase: `grep -r "function functionName"` or use semantic search
2. Check if similar utility exists in `utils/` or `storage/`
3. If found, import it; if not, create in appropriate module

---

### 4. Magic Numbers and Hardcoded Values

**❌ BAD:**

```javascript
div.style.backgroundColor = "#1a1b26";
div.style.padding = "12px";
const maxHistory = 1000;
```

**✅ GOOD:**

```javascript
import { COLORS } from "./ui/constants/colors.js";
import { PADDING } from "./ui/constants/styles.js";
import { STORAGE } from "./ui/constants/defaults.js";

div.style.backgroundColor = COLORS.background.primary;
div.style.padding = PADDING.md;
const maxHistory = STORAGE.maxHistoryRounds;
```

**Constants locations:**

- **Colors**: `src/ui/constants/colors.js`
- **Styles** (padding, border radius, font sizes): `src/ui/constants/styles.js`
- **Defaults** (max values, intervals, thresholds): `src/ui/constants/defaults.js`

---

## ✅ Best Practices

### Module Organization

**Follow single responsibility principle:**

- `storage/` - Data persistence (history, settings, savedNumbers, etc.)
- `utils/` - Pure helper functions (calculations, DOM manipulation, analysis)
- `ui/` - Preact components and UI logic
- `generators/` - Number generation algorithms
- `core/` - State management and events

**Always use explicit imports:**

```javascript
// ✅ Good - clear dependencies
import { state } from "./core/state.js";
import { generateNumbers } from "./ui/numberSelection.js";
import { COLORS } from "./ui/constants/colors.js";

// ❌ Bad - hidden dependency via window global
const numbers = window.__keno_generateNumbers();
```

---

### Reactive Patterns

**Use events for state updates:**

```javascript
// When data changes, emit event
export function saveRound(data) {
  state.currentHistory.push(data);
  stateEvents.emit(EVENTS.HISTORY_UPDATED, data);
}

// Components listen for events
useEffect(() => {
  const unsubscribe = stateEvents.on(EVENTS.HISTORY_UPDATED, () => {
    updateUI();
  });

  return unsubscribe; // Cleanup on unmount
}, []);
```

**Available events** (see `src/core/stateEvents.js`):

- `HISTORY_UPDATED` - Round saved or history cleared
- `GENERATOR_UPDATED` - Generator predictions refreshed
- `PROFIT_UPDATED` - Session or total profit changed
- `HEATMAP_UPDATED` - Heatmap recalculated
- `SETTINGS_CHANGED` - User changed settings

---

### DOM Observation

**Use MutationObserver instead of polling:**

```javascript
// ✅ Good - observes actual changes
function waitForElement(selector) {
  return new Promise((resolve) => {
    const element = document.querySelector(selector);
    if (element) return resolve(element);

    const observer = new MutationObserver(() => {
      const element = document.querySelector(selector);
      if (element) {
        observer.disconnect();
        resolve(element);
      }
    });

    observer.observe(document.body, { childList: true, subtree: true });
  });
}

// ❌ Bad - polls every 100ms
function waitForElement(selector) {
  return new Promise((resolve) => {
    const check = () => {
      const element = document.querySelector(selector);
      if (element) resolve(element);
      else setTimeout(check, 100);
    };
    check();
  });
}
```

---

### Code Documentation

**All public functions need JSDoc:**

```javascript
/**
 * Generate number predictions using active generator method
 * @param {boolean} forceRefresh - Skip cache and generate fresh predictions
 * @returns {Object} { predictions: number[], method: string, cached: boolean }
 */
export function generateNumbers(forceRefresh = false) {
  // Implementation
}
```

**Required fields:**

- Description of what function does
- `@param` for each parameter (type + description)
- `@returns` for return value (type + description)

---

## 🔍 Before Submitting Code

### Pre-commit Checklist

1. **Run linter:** `npm run lint`
   - Must pass with 0 errors
   - Warnings are acceptable if justified
2. **Check for duplicates:**

   - Search for similar functions before creating new ones
   - Use semantic search or grep to find existing utilities

3. **Verify imports:**

   - No window globals in Preact components
   - All dependencies explicitly imported
   - Relative paths use `.js` extension

4. **Test build:** `npm run build`

   - Must succeed without errors
   - Check bundle size (should be ~140kb)

5. **Review constants:**
   - No hardcoded colors (use `COLORS`)
   - No magic numbers (use `DEFAULTS`)
   - No duplicate styles (use `STYLES`)

---

## 🎯 When to Use ESLint Exemptions

**Current exempted files** (see `eslint.config.mjs`):

- `src/content.js` - Message listener bridge
- `src/bridges/windowGlobals.js` - Intentional legacy bridge
- `src/ui/previewHighlight.js` - Preview system bridge
- Generator cores - Debug function exports
- Storage modules - Temporary window globals during migration

**Before adding new exemptions, ask:**

1. Is this truly a legitimate use case?
2. Can I refactor to avoid needing the exemption?
3. Is there a cleaner pattern available?

**Red flags that indicate bad code:**

- "I need window globals because it's easier"
- "setInterval is simpler than MutationObserver"
- "This function already exists but my version is slightly different"

---

## 📚 Learning Resources

**Project patterns to study:**

- Event system: `src/core/stateEvents.js`
- MutationObserver: `src/ui/overlayInit.js` (observeFooterForButton)
- Constants: `src/ui/constants/*.js`
- Module organization: `src/` directory structure

**Key refactoring commits:**

- Constants extraction (Phase 1)
- Window globals elimination (Issue 7)
- Event-driven updates (Option C)
- Polling elimination (setInterval removal)

---

## 🤖 Guidelines for AI Assistants

When generating code for this project:

1. **Never use `setInterval()` for state/DOM checks** - Use events or MutationObserver
2. **Never access `window.__keno_*` in components** - Import functions directly
3. **Always search for existing functions first** - Avoid duplicates
4. **Use constants for colors/styles/defaults** - Never hardcode
5. **Follow module organization** - Put code in the right place
6. **Add JSDoc comments** - Document all public functions
7. **Prefer reactive patterns** - Events over polling

**When user requests a new feature:**

1. Search for existing utilities that can be reused
2. Check if similar functionality exists elsewhere
3. Use constants from `src/ui/constants/`
4. Follow existing patterns (events, imports, etc.)
5. Run `npm run lint` to verify compliance

---

## Questions?

If you're unsure about a pattern or need clarification, check:

1. `.github/copilot-instructions.md` - Comprehensive architecture guide
2. `tmp/codebase-audit.md` - Recent refactoring decisions
3. Existing code - Follow established patterns
4. ESLint errors - They'll guide you to the right approach
