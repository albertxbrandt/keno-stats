/**
 * Mines Overlay Component
 * Simple draggable overlay for Mines game tracking
 */

import { h } from 'preact';
import { useState } from 'preact/hooks';
import { Bomb, X } from 'lucide-preact';
import { COLORS } from '@/shared/constants/colors.js';
import { SPACING } from '@/shared/constants/styles.js';
import { DragHandle } from '@/shared/components/DragHandle.jsx';
import { Button } from '@/shared/components/Button.tsx';

export function MinesOverlay({ onClose }) {
  const [isDragging, setIsDragging] = useState(false);

  return (
    <div
      style={{
        position: 'fixed',
        top: '100px',
        right: '20px',
        width: '320px',
        background: COLORS.bg.dark,
        border: `1px solid ${COLORS.border.default}`,
        borderRadius: '8px',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
        zIndex: 9999999,
      }}
    >
      {/* Header */}
      <DragHandle
        onDragStart={() => setIsDragging(true)}
        onDragEnd={() => setIsDragging(false)}
        style={{
          background: COLORS.bg.darkest,
          padding: SPACING.md,
          borderTopLeftRadius: '8px',
          borderTopRightRadius: '8px',
          borderBottom: '1px solid #1a2c38',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div
            style={{
              fontWeight: '600',
              color: COLORS.text.primary,
              fontSize: '14px',
              letterSpacing: '0.01em',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
            }}
          >
            <Bomb size={18} strokeWidth={2} style={{ opacity: 0.9 }} />
            Mines Tracker
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: COLORS.text.secondary,
              cursor: 'pointer',
              padding: '4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'color 0.2s ease',
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.color = COLORS.text.primary;
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.color = COLORS.text.secondary;
            }}
          >
            <X size={18} strokeWidth={2} />
          </button>
        </div>
      </DragHandle>

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
    </div>
  );
}
