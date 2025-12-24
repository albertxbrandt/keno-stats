# Preact Component Architecture

## Overview

The Keno Stats Tracker overlay UI has been fully refactored to use Preact components. This provides a maintainable, testable, and performant architecture with clear separation of concerns.

## Why Preact?

- **Lightweight**: ~3KB (vs React's ~40KB)
- **Fast**: Virtual DOM with excellent performance
- **Compatible**: Hooks API similar to React
- **JSX Support**: esbuild handles JSX transpilation automatically
- **Perfect for Extensions**: Small bundle size is critical for browser extensions

## Directory Structure

```
src/ui/components/
├── Overlay.jsx                    # ✅ Main container with drag support
├── README.md                      # This file
├── shared/                        # ✅ Reusable UI primitives
│   ├── DragHandle.jsx            # ✅ Draggable header (mouse + touch)
│   ├── ToggleSwitch.jsx          # ✅ Animated toggle component
│   ├── CollapsibleSection.jsx    # ✅ Hover/pin expandable sections
│   ├── NumberInput.jsx            # ✅ Validated number input
│   └── Modal.jsx                  # ✅ Base modal component
├── sections/                      # ✅ Major overlay sections
│   ├── HeatmapSection.jsx        # ✅ Heatmap controls
│   ├── GeneratorSection.jsx      # ✅ Main generator UI
│   ├── HitsMissSection.jsx       # ✅ Hits/miss display
│   ├── ProfitLossSection.jsx     # ✅ Profit/loss tracker
│   ├── PatternAnalysisSection.jsx # ✅ Pattern analysis
│   ├── RecentPlaysSection.jsx    # ✅ Recent plays list
│   └── HistorySection.jsx        # ✅ Bet history
├── generator/                     # ✅ Generator sub-components
│   ├── GeneratorHeader.jsx        # ✅ Collapsible header
│   ├── GeneratorPreview.jsx       # ✅ Next numbers preview
│   ├── MethodSelector.jsx         # ✅ Method dropdown
│   ├── ShapesParams.jsx           # ✅ Shapes configuration
│   ├── MomentumParams.jsx         # ✅ Momentum configuration
│   └── AutoRefreshControl.jsx     # ✅ Auto-refresh toggle/interval
└── modals/                        # ✅ Modal dialogs
    ├── SavedNumbersModal.jsx      # ✅ Saved numbers management
    ├── CombinationHitsModal.jsx   # ✅ Combination analysis
    ├── PatternAnalysisModal.jsx   # ✅ Pattern results
    ├── PatternLoadingModal.jsx    # ✅ Pattern loading spinner
    └── ComparisonModal.jsx        # ✅ Method comparison window
```

## Migration Status

### ✅ Complete - ALL COMPONENTS MIGRATED!

**Foundation:**

- ✅ Overlay container with drag support (mouse + touch)
- ✅ DragHandle component with position management
- ✅ Tab switching (Tracker/Settings)
- ✅ Modal system with useModals hook

**Sections:**

- ✅ HeatmapSection - Mode toggle, sample size input
- ✅ GeneratorSection - All sub-components:
  - ✅ GeneratorHeader
  - ✅ GeneratorPreview (Next Numbers display)
  - ✅ MethodSelector (with param visibility logic)
  - ✅ ShapesParams
  - ✅ MomentumParams
  - ✅ AutoRefreshControl
- ✅ HitsMissSection - Hits/miss display
- ✅ ProfitLossSection - Session/total display, currency selector
- ✅ PatternAnalysisSection - Pattern size input, analyze button
- ✅ RecentPlaysSection - Recent plays list, saved combos button
- ✅ HistorySection - Bet history list, clear button, bet book button

**Modals:**

- ✅ SavedNumbersModal - Save/load/delete number combinations
- ✅ CombinationHitsModal - Analyze combination hit rates
- ✅ PatternAnalysisModal - Display pattern results
- ✅ PatternLoadingModal - Loading spinner
- ✅ ComparisonModal - Method comparison window

**Shared Components:**

- ✅ DragHandle - Draggable header (mouse + touch support)
- ✅ ToggleSwitch - Animated toggle component
- ✅ CollapsibleSection - Hover/pin expandable sections
- ✅ NumberInput - Validated number input
- ✅ Modal - Base modal component

**Legacy Code:**

- ✅ `overlay.js` archived to `archived/legacy-overlay/`
- ✅ All functionality moved to Preact components

## Component Patterns

### 1. JSX Syntax

We use standard JSX with Preact - esbuild transpiles it automatically:

```javascript
import { useState } from "preact/hooks";

function MyComponent({ name }) {
  const [count, setCount] = useState(0);

  return (
    <div>
      <h1>Hello {name}!</h1>
      <button onClick={() => setCount(count + 1)}>Count: {count}</button>
    </div>
  );
}
```

**No JSX pragma needed!** esbuild handles JSX transpilation without requiring an explicit `h` import.

### 2. State Management

- **Local State**: Use `useState` for component-specific state
- **Global State**: Import from `state.js` for shared extension state
- **Sync Pattern**: Use `useEffect` to sync global state to local state

```javascript
import { useState, useEffect } from "preact/hooks";
import { state } from "../../../core/state.js";

function MyComponent() {
  const [value, setValue] = useState(state.someValue);

  useEffect(() => {
    setValue(state.someValue);
  }, [state.someValue]); // Re-run when global state changes
}
```

### 3. Event Handlers

- **Inline handlers**: Use arrow functions for simple logic
- **Extracted handlers**: Use `useCallback` for complex logic to prevent re-renders

```javascript
// Simple inline
onClick=${() => setSomething(true)}

// Complex extracted
const handleClick = useCallback(() => {
  // Complex logic here
  saveSettings();
  updatePreview();
}, [dependencies]);
```

### 4. Styles

- **Inline styles**: Use style objects with camelCase properties
- **Conditional styles**: Use ternary operators or computed values

```javascript
style=${{
  backgroundColor: isActive ? '#74b9ff' : '#444',
  transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
  transition: 'all 0.3s ease'
}}
```

## Integration with Existing Code

### Phase 1: Parallel Operation (Current)

- Old `overlay.js` remains functional
- New Preact components developed alongside
- Test each component in isolation

### Phase 2: Gradual Migration

- Mount Preact overlay instead of old overlay
- Hook up event handlers to existing functions
- Ensure feature parity

### Phase 3: Cleanup

- Remove old `overlay.js`
- Update imports throughout codebase
- Remove unused code

## Testing Strategy

1. **Visual Testing**: Load extension and verify UI renders correctly
2. **Interaction Testing**: Click buttons, toggles, inputs - verify state updates
3. **Integration Testing**: Ensure hooks to `storage.js`, `heatmap.js`, etc. work
4. **Performance Testing**: Check bundle size impact and render performance

## Build Configuration

The esbuild config automatically handles:

- `.jsx` file bundling
- JSX transpilation (automatic, no pragma needed!)
- Preact import resolution

No changes needed to `package.json` build script!

## Common Gotchas

### 1. Component Imports

Components used in JSX must be imported even if they "look" unused to ESLint:

```javascript
// eslint-disable-next-line no-unused-vars
import { MyComponent } from "./MyComponent.jsx";

// Used in JSX:
return <MyComponent />;
```

### 2. Event Names

Preact uses camelCase for events:

```javascript
// ✅ Correct
onClick = { handleClick };
onChange = { handleChange };
onMouseEnter = { handleHover };
```

### 3. Class Name

JSX uses `className`, not `class`:

```javascript
// ✅ Correct
<div className="my-class"></div>

// ❌ Wrong (HTML syntax)
<div class="my-class"></div>
```

### 4. Refs

For DOM refs, use `useRef` hook:

```javascript
import { useRef, useEffect } from "preact/hooks";

const inputRef = useRef();

useEffect(() => {
  inputRef.current.focus();
}, []);

return <input ref={inputRef} />;
```

## Style Guide

- **Component Names**: PascalCase (e.g., `HeatmapSection.jsx`)
- **File Organization**: One component per file
- **Documentation**: JSDoc comments for all components
- **Props**: Destructure props in function signature
- **Exports**: Named exports, not default
- **Imports**: Group by category (preact, local, utils)
- **No JSX Pragma**: esbuild handles JSX automatically, no `h` import needed

## Performance Tips

1. **Memoization**: Use `useMemo` for expensive computations
2. **Callbacks**: Use `useCallback` for event handlers passed as props
3. **Keys**: Always provide `key` prop for lists
4. **Avoid Inline Functions**: Extract handlers when passing to children
5. **Lazy Loading**: Consider code splitting for large sections

## Migration Checklist

All sections have been successfully migrated! ✅

**Completed:**

- ✅ Created all component files in appropriate directories
- ✅ Added comprehensive JSDoc documentation
- ✅ Extracted inline styles to style objects
- ✅ Converted event handlers to hooks pattern
- ✅ Replaced `document.getElementById` with refs or state
- ✅ Tested functionality in extension
- ✅ Integrated all components into Overlay.jsx
- ✅ Archived old overlay.js to `archived/legacy-overlay/`
- ✅ Updated all external references

## Architecture Improvements

**Before (Legacy):**

- Single 1581-line overlay.js file
- Imperative DOM manipulation
- Global event handlers
- Difficult to test and maintain

**After (Preact):**

- 40+ small, focused components
- Declarative UI with JSX
- Component-scoped state
- Easy to test and extend
- Drag support with touch events
- Modal system with centralized state

## Getting Help

- **Preact Docs**: https://preactjs.com/guide/v10/getting-started
- **Hooks API**: https://preactjs.com/guide/v10/hooks
- **JSX in Preact**: https://preactjs.com/guide/v10/getting-started#alternatives-to-jsx

## Future Enhancements

1. Add unit tests for components
2. Implement position persistence (save/restore overlay location)
3. Add keyboard shortcuts for common actions
4. Create component showcase/demo page
5. Add accessibility features (ARIA labels, keyboard navigation)
