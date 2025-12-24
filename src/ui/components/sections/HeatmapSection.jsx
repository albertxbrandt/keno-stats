// src/ui/components/sections/HeatmapSection.jsx
// Heatmap section - controls for frequency-based tile highlighting

import { useState, useEffect } from 'preact/hooks';
import { state } from '../../../core/state.js';
import { saveHeatmapSettings } from '../../../core/storage.js';
import { updateHeatmap } from '../../../utils/dom/heatmap.js';
import { stateEvents, EVENTS } from '../../../core/stateEvents.js';
import { CollapsibleSection } from '../shared/CollapsibleSection.jsx';
import { ToggleSwitch } from '../shared/ToggleSwitch.jsx';
import { NumberInput } from '../shared/NumberInput.jsx';
import { COLORS } from '../../constants/colors.js';
import { BORDER_RADIUS, SPACING } from '../../constants/styles.js';

/**
 * HeatmapSection Component
 * 
 * Controls for the heatmap feature that highlights numbers on the board
 * based on their frequency in recent games.
 * 
 * Features:
 * - Toggle heatmap on/off
 * - Mode selector (hot numbers vs trending)
 * - Sample size control
 * 
 * @component
 * @returns {preact.VNode} The rendered heatmap section
 */
export function HeatmapSection() {
  const [isEnabled, setIsEnabled] = useState(state.heatmapEnabled || false);
  const [mode, setMode] = useState(state.heatmapMode || 'hot');
  const [sampleSize, setSampleSize] = useState(state.heatmapSampleSize || 100);
  const [maxSampleSize, setMaxSampleSize] = useState(100);

  // Update max sample size when history changes
  useEffect(() => {
    // Initial load
    setMaxSampleSize(state.currentHistory.length || 100);
    
    // Listen for history updates
    const unsubscribe = stateEvents.on(EVENTS.HISTORY_UPDATED, (newHistory) => {
      setMaxSampleSize(newHistory.length || 100);
    });
    
    return unsubscribe;
  }, []);

  const handleToggle = (enabled) => {
    setIsEnabled(enabled);
    state.heatmapEnabled = enabled;
    saveHeatmapSettings();
    updateHeatmap();
  };

  const handleModeChange = (e) => {
    const newMode = e.target.value;
    setMode(newMode);
    state.heatmapMode = newMode;
    saveHeatmapSettings();
    updateHeatmap();
  };

  const handleSampleSizeChange = (value) => {
    setSampleSize(value);
    state.heatmapSampleSize = value;
    saveHeatmapSettings();
    updateHeatmap();
  };

  return (
    <CollapsibleSection
      icon="🗺️"
      title="Heatmap"
      status={isEnabled ? 'Active' : 'Inactive'}
      defaultExpanded={false}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: SPACING.sm }}>
        {/* Enable/Disable Toggle */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ color: COLORS.text.secondary, fontSize: '10px' }}>Enable Heatmap:</span>
          <ToggleSwitch
            checked={isEnabled}
            onChange={handleToggle}
            label=""
          />
        </div>

        {/* Mode Selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: SPACING.sm }}>
          <span style={{ color: COLORS.text.secondary, fontSize: '10px' }}>Mode:</span>
          <select
            value={mode}
            onChange={handleModeChange}
            style={{
              flex: 1,
              background: COLORS.bg.darkest,
              border: `1px solid ${COLORS.border.default}`,
              color: COLORS.text.primary,
              padding: '4px',
              borderRadius: BORDER_RADIUS.sm,
              fontSize: '11px',
              cursor: 'pointer'
            }}
          >
            <option value="hot">🔥 Hot Numbers</option>
            <option value="trending">📈 Trending</option>
          </select>
        </div>

        {/* Sample Size Input */}
        <div style={{ display: 'flex', alignItems: 'center', gap: SPACING.sm }}>
          <span style={{ color: COLORS.text.secondary, fontSize: '10px' }}>Sample Size:</span>
          <NumberInput
            value={sampleSize}
            onChange={handleSampleSizeChange}
            min={1}
            max={maxSampleSize}
            style={{ flex: 1 }}
          />
        </div>

        {/* Info text */}
        {isEnabled && (
          <div style={{ 
            marginTop: '4px', 
            padding: SPACING.inputPadding, 
            background: COLORS.bg.darkest, 
            borderRadius: BORDER_RADIUS.sm,
            fontSize: '9px',
            color: COLORS.text.secondary
          }}>
            {mode === 'hot' 
              ? `Highlighting most frequent numbers from last ${sampleSize} games`
              : `Highlighting trending numbers from last ${sampleSize} games`
            }
          </div>
        )}
      </div>
    </CollapsibleSection>
  );
}
