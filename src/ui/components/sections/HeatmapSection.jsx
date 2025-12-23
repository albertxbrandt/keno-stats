// src/ui/components/sections/HeatmapSection.jsx
// Heatmap section - controls for frequency-based tile highlighting

import { useState, useEffect } from 'preact/hooks';
import { state } from '../../../core/state.js';
import { saveHeatmapSettings } from '../../../core/storage.js';
import { CollapsibleSection } from '../shared/CollapsibleSection.jsx';
import { ToggleSwitch } from '../shared/ToggleSwitch.jsx';
import { NumberInput } from '../shared/NumberInput.jsx';

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
    const updateMax = () => {
      setMaxSampleSize(state.currentHistory.length || 100);
    };
    
    updateMax();
    
    // Poll for history updates (TODO: Replace with event-driven)
    const interval = setInterval(updateMax, 1000);
    
    return () => clearInterval(interval);
  }, []);

  const handleToggle = (enabled) => {
    setIsEnabled(enabled);
    state.heatmapEnabled = enabled;
    saveHeatmapSettings();
    
    // Trigger heatmap update via window hook
    if (window.__keno_updateHeatmap) {
      window.__keno_updateHeatmap();
    }
  };

  const handleModeChange = (e) => {
    const newMode = e.target.value;
    setMode(newMode);
    state.heatmapMode = newMode;
    saveHeatmapSettings();
    
    // Update heatmap display
    if (window.__keno_updateHeatmap) {
      window.__keno_updateHeatmap();
    }
  };

  const handleSampleSizeChange = (value) => {
    setSampleSize(value);
    state.heatmapSampleSize = value;
    saveHeatmapSettings();
    
    // Update heatmap display
    if (window.__keno_updateHeatmap) {
      window.__keno_updateHeatmap();
    }
  };

  return (
    <CollapsibleSection
      icon="🗺️"
      title="Heatmap"
      status={isEnabled ? 'Active' : 'Inactive'}
      defaultExpanded={false}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {/* Enable/Disable Toggle */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ color: '#aaa', fontSize: '10px' }}>Enable Heatmap:</span>
          <ToggleSwitch
            checked={isEnabled}
            onChange={handleToggle}
            label=""
          />
        </div>

        {/* Mode Selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ color: '#aaa', fontSize: '10px' }}>Mode:</span>
          <select
            value={mode}
            onChange={handleModeChange}
            style={{
              flex: 1,
              background: '#14202b',
              border: '1px solid #444',
              color: '#fff',
              padding: '4px',
              borderRadius: '4px',
              fontSize: '11px',
              cursor: 'pointer'
            }}
          >
            <option value="hot">🔥 Hot Numbers</option>
            <option value="trending">📈 Trending</option>
          </select>
        </div>

        {/* Sample Size Input */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ color: '#aaa', fontSize: '10px' }}>Sample Size:</span>
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
            padding: '6px', 
            background: '#14202b', 
            borderRadius: '4px',
            fontSize: '9px',
            color: '#888'
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
