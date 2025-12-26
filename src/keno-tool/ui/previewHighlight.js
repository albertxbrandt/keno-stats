// src/ui/previewHighlight.js
// Modular preview number highlighting system
// Handles hover-based preview of next numbers on the game board

import { state } from '@/keno-tool/core/state.js';
import { stateEvents, EVENTS } from '@/keno-tool/core/stateEvents.js';
import { highlightPrediction } from '@/shared/utils/dom/heatmap.js';
import { clearHighlight } from '@/shared/utils/dom/tileSelection.js';

// ==================== STATE ====================

let isHoveringSelectButton = false;
let isHoveringPreviewBox = false;

// Listen for preview updates and refresh highlight if hovering OR always-show is enabled
stateEvents.on(EVENTS.GENERATOR_PREVIEW_UPDATED, () => {
  if (isHoveringSelectButton || isHoveringPreviewBox || state.generatorAlwaysShowPreview) {
    showPreview();
  }
});

// Listen for custom events from toggle to show/hide preview without refreshing numbers
window.addEventListener('keno-show-preview', () => {
  showPreview();
});

window.addEventListener('keno-hide-preview', () => {
  if (!isHoveringSelectButton && !isHoveringPreviewBox) {
    hidePreview();
  }
});


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
    if (!state.generatorAlwaysShowPreview) {
      showPreview();
    }
  });

  buttonElement.addEventListener('mouseleave', () => {
    isHoveringSelectButton = false;
    if (!state.generatorAlwaysShowPreview) {
      hidePreview();
    }
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
    isHoveringPreviewBox = true;
    if (!state.generatorAlwaysShowPreview) {
      showPreview();
    }
  });

  previewElement.addEventListener('mouseleave', () => {
    isHoveringPreviewBox = false;
    if (!state.generatorAlwaysShowPreview) {
      hidePreview();
    }
  });
}

/**
 * Check if user is currently hovering over the select button or preview box
 * Used to determine if we should re-highlight after preview updates
 * @returns {boolean}
 */
export function isButtonHovering() {
  return isHoveringSelectButton || isHoveringPreviewBox;
}

/**
 * Manually trigger preview highlight refresh || state.generatorAlwaysShowPreview) {
    showPreview();
  } else {
    hidel after preview numbers change while hovering
 */
export function refreshPreviewHighlight() {
  if (isHoveringSelectButton || isHoveringPreviewBox) {
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
