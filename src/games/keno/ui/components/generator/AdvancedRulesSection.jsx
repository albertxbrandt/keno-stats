// src/keno-tool/ui/components/generator/AdvancedRulesSection.jsx
// Button to open advanced refresh rules modal

import { useState, useEffect } from 'preact/hooks';
import { state } from '@/games/keno/core/state.js';
import { AdvancedRulesModal } from '../modals/AdvancedRulesModal.jsx';
import { COLORS } from '@/shared/constants/colors.js';
import { BORDER_RADIUS } from '@/shared/constants/styles.js';

/**
 * AdvancedRulesSection Component
 * 
 * Button to open Advanced Rules modal for condition-based auto-refresh.
 * Shows "ON" indicator when advanced rules are enabled.
 * When enabled, simple mode controls are disabled.
 * 
 * @component
 * @param {Object} props
 * @param {Function} props.onToggle - Callback when advanced rules enabled state changes
 * @returns {preact.VNode}
 */
export function AdvancedRulesSection({ onToggle }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEnabled, setIsEnabled] = useState(state.generatorAdvancedRules?.enabled || false);

  // Sync with global state
  useEffect(() => {
    setIsEnabled(state.generatorAdvancedRules?.enabled || false);
  }, []);

  const handleCloseModal = () => {
    setIsModalOpen(false);
    // Sync state after modal closes
    const newEnabled = state.generatorAdvancedRules?.enabled || false;
    setIsEnabled(newEnabled);
    if (onToggle) {
      onToggle(newEnabled);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        style={{
          width: '100%',
          padding: '8px 12px',
          background: isEnabled ? COLORS.accent.blue + '33' : COLORS.bg.darker,
          color: isEnabled ? COLORS.accent.blue : COLORS.text.secondary,
          border: `1px solid ${isEnabled ? COLORS.accent.blue : COLORS.border.light}`,
          borderRadius: BORDER_RADIUS.xs,
          fontSize: '10px',
          fontWeight: '600',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          transition: 'all 0.2s'
        }}
        onMouseOver={(e) => {
          e.currentTarget.style.background = isEnabled ? COLORS.accent.blue + '44' : COLORS.bg.medium;
        }}
        onMouseOut={(e) => {
          e.currentTarget.style.background = isEnabled ? COLORS.accent.blue + '33' : COLORS.bg.darker;
        }}
      >
        <span>⚙️ Advanced Rules</span>
        {isEnabled && (
          <span style={{
            padding: '2px 6px',
            background: COLORS.accent.blue,
            borderRadius: BORDER_RADIUS.xs,
            fontSize: '8px',
            fontWeight: '700',
            color: COLORS.text.primary
          }}>
            ON
          </span>
        )}
      </button>

      {isModalOpen && (
        <AdvancedRulesModal onClose={handleCloseModal} />
      )}
    </>
  );
}
