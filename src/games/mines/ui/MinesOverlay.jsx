/**
 * Mines Overlay Component
 * Simple draggable overlay for Mines game tracking
 */

import { h } from 'preact';
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
