# Archived Code - Read-Only Reference

This directory contains **archived legacy code** from the Keno Stats Tracker extension that has been refactored or replaced. These files are preserved for **reference purposes only** and should **NOT be edited**.

## Purpose

These archived files serve as:
- **Historical reference** for understanding previous implementation approaches
- **Code archaeology** when debugging edge cases that worked in the old code
- **Feature recovery** when re-implementing features that were temporarily removed during refactoring
- **Documentation** of design decisions and patterns that were tried and abandoned

## ⚠️ Important Guidelines

### DO NOT:
- ❌ Edit files in this directory
- ❌ Import from these files in active code
- ❌ Copy/paste from these files without understanding the refactor context
- ❌ Use these files as the "source of truth" for current behavior

### DO:
- ✅ Read these files to understand previous implementation approaches
- ✅ Reference them when troubleshooting issues that existed before refactoring
- ✅ Use them as a guide when re-implementing removed features (but adapt to new architecture)
- ✅ Check them when verifying behavior changes during refactoring

## Archived Files

### `legacy-overlay/`
Contains the original overlay.js implementation before the Preact migration.
- **Replaced by**: `src/ui/components/Overlay.jsx` and modular Preact components
- **Why archived**: Monolithic HTML string generation replaced with component architecture
- **Use for**: Understanding original UI structure and event handlers

### `patterns.js`
Original pattern analysis implementation with inline UI generation.
- **Replaced by**: `src/utils/calculations/patternAlgorithms.js` (logic) + `src/ui/components/modals/PatternAnalysisModal.jsx` (UI)
- **Why archived**: Mixed concerns (calculation + UI) split into separate modules
- **Use for**: Understanding pattern detection algorithms

### `profitLoss.js`
Legacy profit/loss tracking with direct DOM manipulation.
- **Replaced by**: `src/storage/profitLoss.js` (data) + `src/ui/components/sections/ProfitLossSection.jsx` (UI)
- **Why archived**: Separated data management from UI rendering
- **Use for**: Understanding profit calculation logic

### `savedNumbersCore.js` / `savedNumbersBridge.js`
Original saved numbers implementation.
- **Replaced by**: `src/storage/savedNumbers.js` + `src/ui/components/modals/SavedNumbersModal.jsx`
- **Why archived**: Bridge pattern replaced with direct Preact component state
- **Use for**: Understanding saved number data structures

### `comparisonBridge.js` / `patternsBridge.js`
Bridge modules that connected legacy code to new Preact components.
- **Replaced by**: Direct Preact component state management via hooks
- **Why archived**: Temporary migration code, no longer needed after full Preact refactor
- **Use for**: Understanding the migration strategy

## Migration Context

The codebase underwent a major refactoring in December 2024:

**Old architecture**: Monolithic HTML string generation, global state, window.\_\_keno\_\* bridges  
**New architecture**: Modular Preact components, centralized state, event-driven updates

Files in this directory represent the "before" state. Active code in `src/` represents the "after" state.

## When to Reference These Files

1. **Bug reports mentioning "it used to work differently"** - Check archived code to see original behavior
2. **Feature requests for removed functionality** - Reference archived implementation, then adapt to new architecture
3. **Performance regressions** - Compare old algorithms with new implementations
4. **Debugging edge cases** - Old code might have handled edge cases that new code doesn't

## Deletion Policy

These files should remain archived indefinitely unless:
- The refactor is verified stable for 6+ months
- All features have been successfully re-implemented
- No bug reports reference behavior from the old code
- Team consensus that historical reference is no longer valuable

---

**Last Updated**: December 23, 2025  
**Archived During**: Preact migration and DRY refactoring effort
