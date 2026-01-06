/**
 * Mines Overlay Component
 * Simple draggable overlay for Mines game tracking
 */

import { h, render } from 'preact';
import { Bomb} from 'lucide-preact';
import { COLORS } from '@/shared/constants/colors.js';
import { SPACING } from '@/shared/constants/styles.js';
import { DraggableOverlay } from '@/shared/components/DraggableOverlay.jsx';

export function MinesOverlay({ onClose }) {
  return (
    <DraggableOverlay
      title="Mines Tracker"
      icon={<Bomb size={16} strokeWidth={2} />}
      onClose={onClose}
      isActive={true}
    >
      {/* Content */}
      <div
        style={{
          padding: SPACING.md,
          color: COLORS.text.primary,
        }}
      >
        <div
          style={{
            textAlign: 'center',
            padding: SPACING.lg,
            color: COLORS.text.secondary,
          }}
        >
          <p style={{ marginBottom: SPACING.sm }}>Mines Tracker initialized!</p>
          <p style={{ fontSize: '12px' }}>Game tracking coming soon...</p>
        </div>
      </div>
    </DraggableOverlay>
  );
}

/**
 * Initialize and render the Preact overlay
 * Call this function to mount the overlay to the DOM
 * 
 * @param {HTMLElement} [container] - DOM element to render into (creates if not provided)
 * @param {Function} onClose - Callback when overlay is closed
 * @returns {void}
 * 
 * @example
 * import { initMinesOverlay } from './MinesOverlay.jsx';
 * initMinesOverlay(null, handleClose);
 */
export function initMinesOverlay(container, onClose) {
  // Create container if not provided
  if (!container) {
    container = document.createElement('div');
    container.id = 'mines-tracker-preact-root';
    document.body.appendChild(container);
  }

  // Render the Preact tree
  render(<MinesOverlay onClose={onClose} />, container);
}
