# Preact Component Migration

## Overview

This directory contains the Preact-based refactor of the Keno Stats Tracker overlay UI. The goal is to break down the monolithic 1581-line `overlay.js` file into maintainable, testable, and reusable components.

## Why Preact?

- **Lightweight**: ~3KB (vs React's ~40KB)
- **Fast**: Virtual DOM with excellent performance
- **Compatible**: Hooks API similar to React
- **JSX Support**: esbuild handles JSX transpilation automatically
- **Perfect for Extensions**: Small bundle size is critical for browser extensions

## Directory Structure

```
src/ui/components/
├── Overlay.jsx                    # Main container (entry point)
├── README.md                      # This file
├── shared/                        # Reusable UI primitives
│   ├── ToggleSwitch.jsx          # ✅ Animated toggle component
│   ├── CollapsibleSection.jsx    # ✅ Hover/pin expandable sections
│   └── NumberInput.jsx            # ✅ Validated number input
├── sections/                      # Major overlay sections
│   ├── HitsMissSection.jsx       # ✅ Simple hits/miss display
│   ├── HeatmapSection.jsx        # TODO: Heatmap controls
│   ├── GeneratorSection.jsx      # TODO: Main generator UI (large)
│   ├── ProfitLossSection.jsx     # TODO: Profit/loss tracker
│   ├── PatternAnalysisSection.jsx # TODO: Pattern analysis
│   ├── RecentPlaysSection.jsx    # TODO: Recent plays list
│   └── HistorySection.jsx        # TODO: Bet history
└── generator/                     # Generator sub-components
    ├── GeneratorHeader.jsx        # TODO: Collapsible header
    ├── GeneratorPreview.jsx       # TODO: Next numbers preview
    ├── MethodSelector.jsx         # TODO: Method dropdown
    ├── ShapesParams.jsx           # TODO: Shapes configuration
    ├── MomentumParams.jsx         # TODO: Momentum configuration
    └── AutoRefreshControl.jsx     # TODO: Auto-refresh toggle/interval
```

## Migration Status

### ✅ Complete

- **Foundation**: Directory structure, JSX setup with esbuild
- **Shared Components**: ToggleSwitch, CollapsibleSection, NumberInput
- **Proof of Concept**: HitsMissSection migrated and working

### 🚧 In Progress

- Overlay shell with dragging and tab switching

### 📋 TODO (Priority Order)

1. **DragHandle Component** - Extract drag logic from Overlay
2. **GeneratorSection** - Largest component, break into sub-components:
   - GeneratorHeader
   - GeneratorPreview (Next Numbers display)
   - MethodSelector (with param visibility logic)
   - ShapesParams
   - MomentumParams
   - AutoRefreshControl
3. **HeatmapSection** - Mode toggle, sample size input
4. **HistorySection** - Bet history list, clear button, bet book button
5. **ProfitLossSection** - Session/total display, currency selector
6. **PatternAnalysisSection** - Pattern size input, analyze button
7. **RecentPlaysSection** - Recent plays list, saved combos button
8. **Settings Tab** - Panel visibility toggles, drag-to-reorder

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

For each section to migrate:

- [ ] Create component file in appropriate directory
- [ ] Add comprehensive JSDoc documentation
- [ ] Extract inline styles to style objects
- [ ] Convert event handlers to hooks pattern
- [ ] Replace `document.getElementById` with refs or state
- [ ] Test in isolation
- [ ] Integrate into Overlay.jsx
- [ ] Remove old code from overlay.js
- [ ] Update any external references

## Getting Help

- **Preact Docs**: https://preactjs.com/guide/v10/getting-started
- **Hooks API**: https://preactjs.com/guide/v10/hooks
- **JSX in Preact**: https://preactjs.com/guide/v10/getting-started#alternatives-to-jsx

## Next Steps

1. Complete DragHandle component
2. Start GeneratorSection migration (biggest complexity)
3. Add unit tests for shared components
4. Document state management patterns
5. Create component showcase/demo page
