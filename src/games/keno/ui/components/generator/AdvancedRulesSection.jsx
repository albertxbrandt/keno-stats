// src/keno-tool/ui/components/generator/AdvancedRulesSection.jsx
// Button to open advanced refresh rules modal

import { useState, useEffect } from 'preact/hooks';
import { state } from '@/games/keno/core/state.js';
import { AdvancedRulesModal } from '../modals/AdvancedRulesModal.jsx';
import { ToggleSwitch } from '@/shared/components/ToggleSwitch.jsx';
import { Settings } from 'lucide-preact';
import { COLORS } from '@/shared/constants/colors.js';
import { saveGeneratorSettings } from '@/games/keno/core/storage.js';

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

  const handleToggle = (checked) => {
    state.generatorAdvancedRules = state.generatorAdvancedRules || {};
    state.generatorAdvancedRules.enabled = checked;
    setIsEnabled(checked);
    if (onToggle) {
      onToggle(checked);
    }
    // Save settings
    saveGeneratorSettings();
  };

  return (
    <>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <button
          onClick={() => setIsModalOpen(true)}
          style={{
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '0',
            transition: 'all 0.2s'
          }}
          onMouseOver={(e) => {
            e.currentTarget.querySelector('span').style.textDecoration = 'underline';
          }}
          onMouseOut={(e) => {
            e.currentTarget.querySelector('span').style.textDecoration = 'none';
          }}
          title="Configure Advanced Rules"
        >
          <Settings size={13} strokeWidth={2} color={COLORS.text.secondary} style={{ opacity: 0.8 }} />
          <span style={{ 
            color: COLORS.text.secondary, 
            fontSize: '10px',
            transition: 'text-decoration 0.2s'
          }}>
            Advanced Rules:
          </span>
        </button>
        <ToggleSwitch
          checked={isEnabled}
          onChange={(e) => handleToggle(e.target.checked)}
          dotId="generator-advanced-rules-dot"
        />
      </div>

      {isModalOpen && (
        <AdvancedRulesModal onClose={handleCloseModal} />
      )}
    </>
  );
}
