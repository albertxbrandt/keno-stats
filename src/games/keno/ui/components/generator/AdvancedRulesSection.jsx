// src/keno-tool/ui/components/generator/AdvancedRulesSection.jsx
// Button to open advanced refresh rules modal

import { useState, useEffect } from 'preact/hooks';
import { Button } from '@/shared/components/Button.jsx';
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
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsModalOpen(true)}
          icon={<Settings size={13} strokeWidth={2} />}
          iconPosition="left"
          style={{
            padding: '0',
            fontSize: '10px',
            color: COLORS.text.secondary,
            background: 'transparent',
            border: 'none'
          }}
          title="Configure Advanced Rules"
        >
          Advanced Rules:
        </Button>
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
