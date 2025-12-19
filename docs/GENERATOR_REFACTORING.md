# Generator System Refactoring

## Overview

The generator system has been refactored to follow SOLID principles and improve maintainability. All generator logic has been extracted from `autoplay.js` into a dedicated `src/generators/` directory.

## Architecture

### Directory Structure

```
src/generators/
├── index.js          # Central export & main API
├── base.js           # BaseGenerator abstract class
├── frequency.js      # FrequencyGenerator (hot numbers)
├── cold.js           # ColdGenerator (least frequent)
├── mixed.js          # MixedGenerator (hot + cold)
├── average.js        # AverageGenerator (median frequency)
├── auto.js           # AutoGenerator (best performing method)
├── momentum.js       # MomentumGenerator (momentum algorithm)
├── shapes.js         # ShapesGenerator (shape patterns)
├── factory.js        # GeneratorFactory (instantiation)
└── cache.js          # CacheManager (universal refresh logic)
```

### Key Components

#### 1. BaseGenerator (base.js)

Abstract class that all generators extend. Provides:

- `generate(count, history, config)` - Abstract method each generator implements
- `validateCount(count)` - Clamp count to 1-40 range
- `getSample(history, sampleSize)` - Get sample from history
- `countFrequencies(sample)` - Count number appearances
- `sortByFrequency(counts)` - Sort numbers by frequency

#### 2. Generator Classes

Each generator extends `BaseGenerator` and implements the `generate()` method:

- **FrequencyGenerator**: Returns most frequently appearing numbers
- **ColdGenerator**: Returns least frequently appearing numbers
- **MixedGenerator**: Combines hot and cold numbers
- **AverageGenerator**: Returns numbers with frequencies closest to median
- **AutoGenerator**: Analyzes comparison data and picks best performing method
- **MomentumGenerator**: Wrapper for momentum pattern detection algorithm
- **ShapesGenerator**: Wrapper for shape pattern placement algorithm

#### 3. GeneratorFactory (factory.js)

Singleton factory for creating generator instances:

- `register(key, generator)` - Register a generator
- `get(key)` - Get generator by key
- `getKeys()` - Get all generator keys
- `has(key)` - Check if generator exists

All default generators are auto-registered on instantiation.

#### 4. CacheManager (cache.js)

Handles universal refresh interval logic:

- `get(method, count, state, config)` - Get cached predictions if valid
- `set(method, count, predictions, state, config)` - Store predictions in cache
- `clear()` - Clear all cached predictions
- `clearMethod(method)` - Clear cache for specific method

Cache keys include method, count, and config (pattern, placement, etc.) to ensure correct caching.

### API Usage

#### Generate Predictions

```javascript
import { generatePredictions } from "./generators/index.js";

const result = generatePredictions("frequency", 5, history, state, {
  sampleSize: 100,
});

console.log(result.predictions); // [3, 12, 18, 25, 37]
console.log(result.cached); // false
console.log(result.actuallyRefreshed); // true
```

#### Force Refresh

```javascript
import { forceRefresh } from "./generators/index.js";

// Clear cache for specific method
forceRefresh("frequency");

// Clear all caches
forceRefresh();
```

#### Using Factory Directly

```javascript
import { generatorFactory } from "./generators/index.js";

const generator = generatorFactory.get("frequency");
const predictions = generator.generate(5, history, { sampleSize: 100 });
```

#### Adding New Generators

```javascript
import { BaseGenerator, generatorFactory } from "./generators/index.js";

class MyCustomGenerator extends BaseGenerator {
  constructor() {
    super("MyCustom");
  }

  generate(count, history, config = {}) {
    count = this.validateCount(count);
    // Custom generation logic here
    return [1, 2, 3, 4, 5];
  }
}

// Register your generator
generatorFactory.register("custom", new MyCustomGenerator());
```

## Refactoring Benefits

### Before

- **Single responsibility violation**: `autoplay.js` (1014 lines) contained generation logic, caching, UI updates, autoplay betting, comparison tracking
- **Code duplication**: Each method had similar caching/refresh logic
- **Poor organization**: All generator functions scattered throughout one file
- **Tight coupling**: Direct state mutations, UI calls mixed with business logic
- **Hard to extend**: Adding new generator method required modifying multiple places

### After

- **Separation of concerns**: Generators in dedicated modules, autoplay focused on betting logic
- **Single responsibility**: Each generator class has one job
- **DRY principle**: Shared logic in `BaseGenerator`, caching centralized in `CacheManager`
- **Loose coupling**: Generators are independent, communicate through interfaces
- **Easy to extend**: Add new generator by creating class that extends `BaseGenerator`
- **Better testability**: Each component can be tested in isolation
- **Cleaner code**: 11 focused files instead of 1 monolithic file

### Bundle Size Reduction

- **Before**: 167.9kb
- **After**: 158.5kb (5.6% reduction)

## Migration Notes

### Breaking Changes

None! The refactored `autoplay.js` maintains backward compatibility:

- All exported functions still exist (`getTopPredictions`, `getColdPredictions`, etc.)
- Functions delegate to new generator system under the hood
- Existing imports from `autoplay.js` continue to work

### Deprecated Functions

Legacy generator functions in `autoplay.js` still work but internally delegate to generators:

```javascript
// Still works, but delegates to FrequencyGenerator
export function getTopPredictions(count) {
  const generator = generatorFactory.get("frequency");
  return generator.generate(count, state.currentHistory, {
    sampleSize: state.sampleSize,
  });
}
```

### State Cleanup

The following state properties are no longer used by the refactored system but kept for backward compatibility:

- `shapesInterval` - Replaced by universal `generatorInterval`
- `shapesLastRefresh` - Replaced by universal `generatorLastRefresh`
- `momentumLastRefresh` - Replaced by universal `generatorLastRefresh`
- `momentumActuallyRefreshed` - Replaced by universal `generatorActuallyRefreshed`
- `shapesActuallyRefreshed` - Replaced by universal `generatorActuallyRefreshed`

These can be safely removed in a future major version.

## Testing

### Manual Testing Checklist

1. **Build verification**: ✅ Bundle builds without errors
2. **Frequency generator**: Test hot numbers generation
3. **Cold generator**: Test least frequent numbers
4. **Mixed generator**: Test combination of hot + cold
5. **Average generator**: Test median frequency selection
6. **Auto generator**: Test best method selection
7. **Momentum generator**: Test momentum algorithm integration
8. **Shapes generator**: Test pattern placement
9. **Caching**: Verify cache respects refresh interval
10. **Manual refresh**: Test force refresh bypasses cache
11. **Auto-select**: Test auto-select only triggers on actual refresh
12. **UI integration**: Test all UI controls work correctly

### Unit Testing (Future)

The new architecture makes unit testing much easier:

```javascript
// Example unit test
import { FrequencyGenerator } from "./generators/frequency.js";

test("FrequencyGenerator returns correct predictions", () => {
  const generator = new FrequencyGenerator();
  const history = [
    { hits: [1, 2, 3] },
    { hits: [1, 2, 4] },
    { hits: [1, 5, 6] },
  ];

  const predictions = generator.generate(3, history, { sampleSize: 3 });

  expect(predictions).toEqual([1, 2, 3]); // 1 appears 3x, 2 appears 2x, 3 appears 1x
});
```

## Future Enhancements

### Potential Improvements

1. **TypeScript conversion**: Add type safety to generator interfaces
2. **Unit tests**: Add comprehensive test suite for each generator
3. **Generator plugins**: Allow dynamic loading of custom generators
4. **Configuration profiles**: Save/load generator configurations
5. **Advanced caching**: Add LRU cache with size limits
6. **Performance metrics**: Track generation time for each method
7. **A/B testing**: Compare multiple generator configurations
8. **Machine learning**: Add ML-based prediction generators

### Easy Extensions

Adding new generators is now trivial:

```javascript
// Create new file: src/generators/fibonacci.js
import { BaseGenerator } from "./base.js";

export class FibonacciGenerator extends BaseGenerator {
  constructor() {
    super("Fibonacci");
  }

  generate(count, history, config = {}) {
    count = this.validateCount(count);
    const fib = [1, 2, 3, 5, 8, 13, 21, 34];
    return fib.slice(0, count);
  }
}

// Register in factory.js
import { FibonacciGenerator } from "./fibonacci.js";
this.register("fibonacci", new FibonacciGenerator());

// Now usable everywhere!
const result = generatePredictions("fibonacci", 5, history, state);
```

## Maintenance

### Code Organization

- **Generators**: Each generator is self-contained in its own file
- **Factory**: Central registration point for all generators
- **Cache**: Universal caching logic in one place
- **Autoplay**: Focused on betting logic, not generation
- **State**: Clean separation of concerns

### Adding Features

To add a new generator feature:

1. Create new generator class extending `BaseGenerator`
2. Implement `generate(count, history, config)` method
3. Register in `GeneratorFactory`
4. Update UI to include new method option
5. That's it! No changes to autoplay or other generators

### Debugging

Enable debug logging:

```javascript
// In console
state.debug = true;

// All generators will log detailed info
[generateNumbers] Generating frequency predictions (count: 5)
[generateNumbers] Using cached frequency predictions
[FrequencyGenerator] Sample size: 100, Count: 5
[CacheManager] Cache hit: frequency-5-{"sampleSize":100}
```

## Conclusion

The refactored generator system provides a clean, maintainable, and extensible architecture that follows software engineering best practices. It's easier to understand, test, and extend while maintaining full backward compatibility with the existing codebase.
