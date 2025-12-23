// src/ui/previewHighlight.js
// Modular preview number highlighting system
// Handles hover-based preview of next numbers on the game board

import { state } from '../core/state.js';
import { highlightPrediction, clearHighlight } from '../features/heatmap.js';

// ==================== STATE ====================

let isHoveringSelectButton = false;

// ==================== PUBLIC API ====================

/**
 * Initialize preview highlighting for a button element
 * Shows preview numbers on hover, clears on mouse leave
 * @param {HTMLElement} buttonElement - The button to attach hover handlers to
 * @param {Function} onClickCallback - Optional callback to execute after click (for re-highlighting)
 */
export function initButtonPreviewHighlight(buttonElement, onClickCallback = null) {
  if (!buttonElement) return;

  // Hover to preview numbers on board
  buttonElement.addEventListener('mouseenter', () => {
    isHoveringSelectButton = true;
    showPreview();
  });

  buttonElement.addEventListener('mouseleave', () => {
    isHoveringSelectButton = false;
    hidePreview();
  });

  // If callback provided, call it after click (for re-highlighting after selection)
  if (onClickCallback) {
    const originalClickHandler = buttonElement.onclick;
    buttonElement.onclick = async (e) => {
      if (originalClickHandler) await originalClickHandler(e);
      await onClickCallback();
      // If still hovering after click, re-highlight new preview
      if (isHoveringSelectButton) {
        showPreview();
      }
    };
  }
}

/**
 * Initialize preview highlighting for a preview box element
 * Shows preview numbers on hover, clears on mouse leave
 * @param {HTMLElement} previewElement - The preview box to attach hover handlers to
 */
export function initPreviewBoxHighlight(previewElement) {
  if (!previewElement) return;

  previewElement.addEventListener('mouseenter', () => {
    showPreview();
  });

  previewElement.addEventListener('mouseleave', () => {
    hidePreview();
  });
}

/**
 * Check if user is currently hovering over the select button
 * Used to determine if we should re-highlight after preview updates
 * @returns {boolean}
 */
export function isButtonHovering() {
  return isHoveringSelectButton;
}

/**
 * Manually trigger preview highlight refresh
 * Useful after preview numbers change while hovering
 */
export function refreshPreviewHighlight() {
  if (isHoveringSelectButton) {
    showPreview();
  }
}

// ==================== INTERNAL FUNCTIONS ====================

/**
 * Show preview numbers highlighted on the board
 * @private
 */
function showPreview() {
  if (state.nextNumbers && state.nextNumbers.length > 0) {
    highlightPrediction(state.nextNumbers);
  }
}

/**
 * Clear preview highlights from the board
 * @private
 */
function hidePreview() {
  clearHighlight();
}

// ==================== WINDOW HOOKS ====================

// Expose public API for cross-module calls
window.__keno_initButtonPreviewHighlight = initButtonPreviewHighlight;
window.__keno_initPreviewBoxHighlight = initPreviewBoxHighlight;
window.__keno_refreshPreviewHighlight = refreshPreviewHighlight;
window.__keno_isButtonHovering = isButtonHovering;
