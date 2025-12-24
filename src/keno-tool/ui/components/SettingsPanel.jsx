// src/ui/components/SettingsPanel.jsx
import { h } from 'preact';
import { useState } from 'preact/hooks';
import { state } from '@/keno-tool/core/state.js';
import { ToggleSwitch } from './shared/ToggleSwitch.jsx';
import { COLORS } from '@/shared/constants/colors.js';
import { SPACING, BORDER_RADIUS } from '@/shared/constants/styles.js';
import { stateEvents, EVENTS } from '@/keno-tool/core/stateEvents.js';
import { savePanelVisibility } from '@/keno-tool/core/storage.js';

export function SettingsPanel() {
  const [panelVisibility, setPanelVisibility] = useState({ ...state.panelVisibility });

  // Update state when toggles change
  const handleToggle = (section) => (e) => {
    const isChecked = e.target.checked;

    // Update local state
    const newVisibility = { ...panelVisibility, [section]: isChecked };
    setPanelVisibility(newVisibility);

    // Update global state
    state.panelVisibility = newVisibility;

    // Emit event to notify Overlay to re-render
    stateEvents.emit(EVENTS.SETTINGS_CHANGED, newVisibility);

    // Persist to storage
    savePanelVisibility();
  };

  const sections = [
    { id: 'heatmap', label: 'Heatmap', icon: '🗺️' },
    { id: 'numberGenerator', label: 'Number Generator', icon: '🎲' },
    { id: 'hitsMiss', label: 'Hits / Miss Display', icon: '✅' },
    { id: 'profitLoss', label: 'Profit/Loss', icon: '💰' },
    { id: 'patternAnalysis', label: 'Pattern Analysis', icon: '🔍' },
    { id: 'recentPlays', label: 'Recent Plays', icon: '🎲' },
    { id: 'history', label: 'History', icon: '📜' }
  ];

  return (
    <div style={{
      background: COLORS.bg.dark,
      padding: SPACING.md,
      borderRadius: BORDER_RADIUS.lg
    }}>
      <div style={{ color: COLORS.text.secondary, fontSize: '12px', marginBottom: SPACING.md }}>
        Show/Hide Panel Sections
      </div>

      <div id="settings-list">
        {sections.map(section => (
          <div
            key={section.id}
            class="settings-row"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '10px 0',
              borderBottom: `1px solid ${COLORS.border.default}`
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '16px' }}>{section.icon}</span>
              <span style={{ color: '#fff', fontSize: '12px' }}>{section.label}</span>
            </div>
            <ToggleSwitch
              checked={panelVisibility[section.id] !== false}
              onChange={handleToggle(section.id)}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
