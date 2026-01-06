// src/ui/constants/colors.js
// Centralized color palette for the Keno Tracker extension

export const COLORS = {
  // Background colors
  bg: {
    dark: '#0f212e',
    darker: '#1a2c38',
    darkest: '#14202b',
    lighter: '#2a3b4a'
  },

  // Text colors (improved contrast for WCAG AA compliance)
  text: {
    primary: '#ffffff',
    secondary: '#b8c5d0',  // Improved from #888 (4.5:1 contrast ratio)
    tertiary: '#8b9ba8'    // Improved from #666 (3.5:1 contrast ratio for large text)
  },

  // Accent colors
  accent: {
    success: '#00b894',
    info: '#74b9ff',
    warning: '#ffd700',
    error: '#ff7675'
  },

  // Border colors (improved visibility)
  border: {
    default: '#3d4f5c',    // Improved from #333
    light: '#344e64',      // Improved from #2a3b4a
    lighter: '#2a3f4f'     // Improved from #1a2c38
  }
};
