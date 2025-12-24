// src/ui/constants/styles.js
// Reusable style objects for consistent UI

import { COLORS } from './colors.js';

// Common spacing values
export const SPACING = {
  xs: '4px',
  sm: '8px',
  md: '12px',
  lg: '15px',
  inputPadding: '6px 8px'
};

// Border radius values
export const BORDER_RADIUS = {
  sm: '4px',   // inputs, buttons
  md: '6px',   // cards
  lg: '8px'    // containers, modals
};

// Font sizes
export const FONT_SIZES = {
  xs: '10px',    // small labels
  sm: '11px',    // inputs
  base: '12px',  // body text
  md: '13px',
  lg: '14px',    // headings
  xl: '15px'     // modal titles
};

// Reusable input/select styles
export const INPUT_STYLES = {
  base: {
    padding: SPACING.inputPadding,
    background: COLORS.bg.dark,
    color: COLORS.text.primary,
    border: `1px solid ${COLORS.border.default}`,
    borderRadius: BORDER_RADIUS.sm,
    fontSize: FONT_SIZES.sm
  },

  select: {
    padding: SPACING.inputPadding,
    background: COLORS.bg.dark,
    color: COLORS.text.primary,
    border: `1px solid ${COLORS.border.default}`,
    borderRadius: BORDER_RADIUS.sm,
    fontSize: FONT_SIZES.sm,
    cursor: 'pointer'
  },

  number: {
    padding: SPACING.inputPadding,
    background: COLORS.bg.dark,
    color: COLORS.text.primary,
    border: `1px solid ${COLORS.border.default}`,
    borderRadius: BORDER_RADIUS.sm,
    fontSize: FONT_SIZES.sm,
    textAlign: 'center'
  }
};

// Card styles
export const CARD_STYLES = {
  base: {
    background: COLORS.bg.dark,
    padding: SPACING.lg,
    borderRadius: BORDER_RADIUS.lg,
    marginBottom: SPACING.lg
  },

  compact: {
    background: COLORS.bg.dark,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md
  }
};

// Label styles
export const LABEL_STYLES = {
  base: {
    color: COLORS.text.secondary,
    fontSize: FONT_SIZES.xs,
    display: 'block',
    marginBottom: SPACING.xs
  }
};
