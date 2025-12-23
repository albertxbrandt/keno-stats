# Legacy Overlay Code Archive

This directory contains the original HTML-based overlay implementation that has been replaced by the Preact component architecture.

## Archived Files

### `overlay.js` (1577 lines)

- **Original Purpose**: Monolithic UI creation and management
- **Replaced By**: `src/ui/components/` directory with Preact components
- **Date Archived**: December 23, 2025
- **Reason**: Completed Preact refactor - all functionality migrated to modular component architecture

**What it contained:**

- HTML string generation for all UI panels
- Event handlers for all controls
- Panel visibility management
- Footer button injection
- Generator controls, heatmap controls, history display, etc.

**Migration mapping:**

- Generator section → `src/ui/components/sections/GeneratorSection.jsx` + 6 sub-components
- Heatmap section → `src/ui/components/sections/HeatmapSection.jsx`
- History section → `src/ui/components/sections/HistorySection.jsx`
- Profit/Loss section → `src/ui/components/sections/ProfitLossSection.jsx`
- Pattern analysis → `src/ui/components/sections/PatternAnalysisSection.jsx`
- Recent plays → `src/ui/components/sections/RecentPlaysSection.jsx`
- Hits/Misses → `src/ui/components/sections/HitsMissSection.jsx`
- Drag handle → `src/ui/components/shared/DragHandle.jsx`

**Current implementation**: `src/ui/overlayInit.js` + `src/ui/components/Overlay.jsx`

### `autoplay.js`

- **Original Purpose**: Automated betting functionality
- **Replaced By**: N/A (feature disabled for TOS compliance)
- **Date Archived**: December 23, 2025
- **Reason**: Feature disabled per Stake.com Terms of Service Section 5.1(y) which prohibits "software-assisted methods"

**Status**: Functionality commented out in `src/content.js` and UI removed from overlay

## Why Archive Instead of Delete?

These files are preserved as reference material:

1. **Historical context** - understand implementation decisions
2. **Feature reference** - if re-implementing any disabled features (with proper compliance)
3. **Migration verification** - ensure no functionality was lost during Preact refactor
4. **Code examples** - DOM manipulation patterns and event handling

## Do NOT Import These Files

These files are **not** part of the build and should **never** be imported by active code. They are for reference only.

## Refactor Statistics

**Before (overlay.js):**

- 1 monolithic file
- 1577 lines
- HTML string templates
- Bundle: 163.8kb

**After (Preact components):**

- 20+ modular component files
- ~2000 lines total (but organized)
- JSX with proper component lifecycle
- Bundle: 149.0kb (-14.8kb, -9%)
- Event-driven architecture (no polling)
- 0 ESLint warnings

## Related Documentation

- `/docs/dev/REFACTORING_SUMMARY.md` - Complete refactor documentation
- `src/ui/components/README.md` - Preact component architecture
- `.github/copilot-instructions.md` - Updated development guidelines
