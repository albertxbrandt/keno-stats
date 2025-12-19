# DOM Reader Module - Developer Guide

## Overview

The `domReader.js` module provides a centralized, well-documented collection of helper functions for reading data from UI elements. This module was created to:

1. **Eliminate code duplication** - Replace scattered `parseInt()`, `.value`, `.checked` patterns across files
2. **Improve code consistency** - Standardized API for all DOM reading operations
3. **Add validation & safety** - Built-in min/max clamping, default values, null-safety
4. **Better documentation** - Each function has JSDoc with examples and use cases

## Quick Start

```javascript
// Instead of this:
const value = parseInt(document.getElementById('my-input').value) || 0;
if (isNaN(value) || value < 1) value = 1;
if (value > 40) value = 40;

// Use this:
import { getIntValue } from './domReader.js';
const value = getIntValue('my-input', 0, { min: 1, max: 40 });
```

## Function Categories

### 1. Input Value Readers
Functions for reading values from input elements with automatic validation:

- **`getInputValue(elementOrId, defaultValue)`** - Get raw string value
- **`getIntValue(elementOrId, defaultValue, options)`** - Get integer with min/max clamping
- **`getFloatValue(elementOrId, defaultValue, options)`** - Get float with min/max clamping
- **`getCheckboxValue(elementOrId, defaultValue)`** - Get boolean checked state
- **`getSelectValue(elementOrId, defaultValue)`** - Get selected option value

### 2. Text Content Readers
Functions for reading text content from elements:

- **`getTextContent(elementOrId, options)`** - Get text with optional trimming
- **`getTileNumber(tileElement)`** - Extract number from Keno tile (strips %)

### 3. Attribute Readers
Functions for reading element attributes and states:

- **`getAttributeValue(elementOrId, attributeName, defaultValue)`** - Get any attribute
- **`isElementDisabled(elementOrId)`** - Check if element is disabled (multiple methods)

### 4. Multi-Element Readers
Functions for batch operations on multiple elements:

- **`getAllInputValues(elementIds, defaultValue)`** - Get values from array of inputs
- **`getAllCheckboxStates(elementIds)`** - Get checked states from array of checkboxes

### 5. Game-Specific Readers (Keno UI)
Functions specific to the Keno game board:

- **`getSelectedTileNumbers()`** - Get array of selected tile numbers (1-40)
- **`getSelectedTileCount()`** - Get count of selected tiles
- **`getAllTileElements()`** - Get all tile button elements
- **`getTileCount()`** - Get total number of tiles
- **`getBetButtonState()`** - Get bet button state object (enabled, ready, etc.)

### 6. Configuration Readers
Functions that read entire configuration objects from UI:

- **`getMomentumConfigFromUI()`** - Read all momentum generator settings
- **`getPatternConfigFromUI()`** - Read all pattern analysis settings
- **`getGeneratorConfigFromUI()`** - Read all generator settings
- **`getAutoPlayConfigFromUI()`** - Read all auto-play settings
- **`getHeatmapConfigFromUI()`** - Read all heatmap settings

### 7. Utility Functions
Helper functions for DOM operations:

- **`waitForElement(selector, timeout)`** - Wait for element to appear (returns Promise)
- **`elementExists(selector)`** - Check if element exists in DOM

## Usage Examples

### Reading Input Values

```javascript
import { getIntValue, getFloatValue, getCheckboxValue } from './domReader.js';

// Integer with automatic validation and clamping
const predictionCount = getIntValue('prediction-count', 3, { min: 1, max: 40 });

// Float with constraints
const threshold = getFloatValue('momentum-threshold', 1.5, { min: 1.0, max: 3.0 });

// Checkbox state
const isAutoSelectEnabled = getCheckboxValue('generator-auto-select-switch');
```

### Reading Select Options

```javascript
import { getSelectValue } from './domReader.js';

// Get selected method from dropdown
const method = getSelectValue('generator-method-select', 'frequency');

// Use in conditional logic
if (method === 'momentum') {
  // Show momentum-specific UI
}
```

### Reading Configuration Objects

```javascript
import { getGeneratorConfigFromUI, getMomentumConfigFromUI } from './domReader.js';

// Read entire generator configuration at once
const config = getGeneratorConfigFromUI();
console.log(config);
// {
//   count: 3,
//   method: 'frequency',
//   sampleSize: 5,
//   autoSelect: true,
//   interval: 0
// }

// Read momentum-specific configuration
const momentumConfig = getMomentumConfigFromUI();
const predictions = generator.generate(history, momentumConfig);
```

### Reading Tile Data

```javascript
import { getSelectedTileNumbers, getTileNumber } from './domReader.js';

// Get all currently selected tiles
const selectedNumbers = getSelectedTileNumbers();
console.log(`Player selected ${selectedNumbers.length} numbers:`, selectedNumbers);
// Output: Player selected 5 numbers: [3, 12, 18, 25, 37]

// Read individual tile
const tiles = document.querySelectorAll('button');
const tileNum = getTileNumber(tiles[0]); // Extracts number from "12%" or "12"
```

### Waiting for Elements

```javascript
import { waitForElement } from './domReader.js';

// Wait for bet button to appear before clicking
const button = await waitForElement('button[data-testid="bet-button"]', 5000);
if (button) {
  simulateClick(button);
} else {
  console.warn('Bet button not found after 5 seconds');
}
```

## Migration Guide

### Before (Anti-pattern)

```javascript
// ❌ Manual parsing with repeated validation
const input = document.getElementById('sample-size-input');
let val = parseInt(input.value, 10);
if (isNaN(val) || val < 1) val = 1;
const max = Math.max(state.currentHistory.length, 1);
if (val > max) val = max;
state.sampleSize = val;

// ❌ Checking checkbox manually
const checkbox = document.getElementById('my-checkbox');
if (checkbox && checkbox.checked) {
  // Do something
}

// ❌ Reading select value directly
const method = document.getElementById('method-select').value;
```

### After (Best practice)

```javascript
// ✅ Clean, validated, one-liner
import { getIntValue, getCheckboxValue, getSelectValue } from './domReader.js';

const max = Math.max(state.currentHistory.length, 1);
const val = getIntValue('sample-size-input', 1, { min: 1, max });
state.sampleSize = val;

// ✅ Simple boolean check
if (getCheckboxValue('my-checkbox')) {
  // Do something
}

// ✅ Safe select reading with default
const method = getSelectValue('method-select', 'frequency');
```

## Common Patterns

### Pattern 1: Input with Validation

```javascript
// Reading number input with min/max constraints
const count = getIntValue('generator-count', 3, { min: 1, max: 40 });

// If element doesn't exist, returns default (3)
// If value is invalid (NaN), returns default (3)
// If value < 1, returns 1
// If value > 40, returns 40
// Otherwise returns parsed integer
```

### Pattern 2: Configuration Object

```javascript
// Read entire configuration in one call
function startAutoPlay() {
  const config = getAutoPlayConfigFromUI();
  // config = {
  //   rounds: 5,
  //   predictionCount: 3,
  //   method: 'frequency'
  // }
  
  autoPlayPlaceBet(config.rounds, config.predictionCount);
}
```

### Pattern 3: Element State Checking

```javascript
import { getBetButtonState } from './domReader.js';

// Get comprehensive button state
const btnState = getBetButtonState();

if (btnState.ready) {
  console.log('Ready to place bet');
  simulateClick(btnState.element);
} else if (!btnState.exists) {
  console.warn('Bet button not found');
} else if (!btnState.enabled) {
  console.warn('Bet button is disabled');
}
```

### Pattern 4: Multi-Element Reading

```javascript
import { getAllInputValues, getAllCheckboxStates } from './domReader.js';

// Read all column visibility checkboxes at once
const visibility = getAllCheckboxStates([
  'toggle-date',
  'toggle-amount',
  'toggle-hits',
  'toggle-misses'
]);
// Returns: { 'toggle-date': true, 'toggle-amount': false, ... }

// Read all inputs in a form
const formData = getAllInputValues(['name', 'email', 'age']);
// Returns: { name: 'John', email: 'john@example.com', age: '25' }
```

## Files Updated

The following files now use `domReader.js` functions:

- **src/overlay.js** - All input reading (15+ replacements)
- **src/patterns.js** - Pattern config reading (6 replacements)
- **src/savedNumbers.js** - Risk mode & lookback reading (4 replacements)
- **src/stats.js** - Tile selection reading (exports from domReader)
- **src/numberSelection.js** - Prediction count reading (2 replacements)

## Benefits

### Code Reduction
- **Before**: ~150 lines of scattered input parsing code
- **After**: ~50 lines using domReader functions
- **Savings**: 100 lines removed, consolidated into reusable module

### Improved Safety
- Automatic null-safety (handles missing elements)
- Built-in validation (min/max clamping)
- Consistent default value handling
- Protection against NaN and invalid inputs

### Better Maintainability
- Single source of truth for DOM reading logic
- Comprehensive JSDoc documentation with examples
- Easy to add new helper functions
- Consistent API across entire codebase

### Enhanced Developer Experience
- IntelliSense support with JSDoc
- Clear function names that describe purpose
- Reduced cognitive load (don't need to remember validation patterns)
- Copy-paste examples from documentation

## Adding New Functions

When you need to read data from UI in a new way:

1. Check if existing function can be extended
2. If not, add new function to appropriate category in `domReader.js`
3. Follow existing naming conventions (`get*`, `is*`, `wait*`)
4. Add comprehensive JSDoc with:
   - Description
   - `@param` for all parameters with types and defaults
   - `@returns` with type and description
   - `@example` with usage example
5. Update this guide with the new function

### Example: Adding a New Function

```javascript
/**
 * Get selected index from a select element (useful for multi-select)
 * @param {string|HTMLElement} elementOrId - Element ID or HTMLElement
 * @param {number} [defaultIndex=0] - Default index if element not found
 * @returns {number} Selected option index
 * 
 * @example
 * const index = getSelectIndex('my-select', 0);
 * console.log(`Selected option at index ${index}`);
 */
export function getSelectIndex(elementOrId, defaultIndex = 0) {
    const element = typeof elementOrId === 'string' 
        ? document.getElementById(elementOrId) 
        : elementOrId;
    
    if (!element) return defaultIndex;
    return element.selectedIndex;
}
```

## Testing

When updating files to use `domReader.js`:

1. **Build test**: Run `npm run build` - should complete without errors
2. **Runtime test**: Load extension in browser, verify all features work
3. **Edge cases**: Test with missing elements, invalid values, boundary conditions
4. **Console check**: No errors/warnings related to DOM reading

### Test Checklist
- [ ] Number inputs return correct values with validation
- [ ] Checkboxes return boolean states
- [ ] Selects return option values
- [ ] Config readers return complete objects
- [ ] Tile reading functions work on game board
- [ ] Missing elements return defaults (no crashes)
- [ ] Invalid inputs (NaN, out of range) are handled gracefully

## Best Practices

### DO ✅
- Use `domReader` functions for all UI data reading
- Import only functions you need (`import { getIntValue } from './domReader.js'`)
- Provide sensible defaults
- Use min/max constraints when reading numbers
- Use configuration reader functions for related groups of inputs

### DON'T ❌
- Don't parse input values manually (`parseInt(el.value)`)
- Don't access `.checked` directly - use `getCheckboxValue()`
- Don't access `.value` directly - use `getInputValue()` or type-specific functions
- Don't duplicate DOM queries - use the helpers
- Don't skip validation - helpers provide it automatically

## Performance Considerations

- All functions have minimal overhead (simple wrappers)
- No caching - reads always return current DOM state
- Configuration readers make multiple calls but are efficient (typically <1ms)
- Tile reading functions query DOM each time - cache results if calling repeatedly in loop

## Future Enhancements

Potential additions to `domReader.js`:

- **Textarea reading** - Similar to input but with multi-line support
- **Radio button groups** - Get selected value from radio group
- **Range sliders** - Get value with min/max from range inputs
- **Date inputs** - Parse date/time values
- **Validation helpers** - Email, URL, pattern validation
- **Form serialization** - Read entire form as object
- **Local storage integration** - Save/load input states

## Related Documentation

- [Tile Selection Module](./TILE_SELECTION_GUIDE.md) - For selecting tiles on game board
- [Generator System](./GENERATOR_SYSTEM.md) - For number generation algorithms
- [Architecture Overview](../README.md) - Overall project structure

## Questions?

If you're unsure which function to use or how to read a specific UI element:

1. Check the function categories above
2. Look at usage examples in existing code (search for `import { ... } from './domReader.js'`)
3. Check JSDoc in `src/domReader.js` for inline examples
4. Add a question to the GitHub issues

---

**Last Updated**: 2025-12-18  
**Module Location**: `src/domReader.js`  
**Total Functions**: 25+  
**Lines of Code**: ~600 (including documentation)
