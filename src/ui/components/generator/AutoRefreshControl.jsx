// src/ui/components/generator/AutoRefreshControl.jsx
// Toggle and interval input for auto-refresh functionality

import { useState, useEffect } from 'preact/hooks';
import { state } from '../../../core/state.js';
import { saveGeneratorSettings } from '../../../core/storage.js';
import { ToggleSwitch } from '../shared/ToggleSwitch.jsx';
import { NumberInput } from '../shared/NumberInput.jsx';
import { COLORS } from '../../constants/colors.js';
import { BORDER_RADIUS, SPACING } from '../../constants/styles.js';

/**
 * AutoRefreshControl Component
 * 
 * Controls for automatic prediction refresh:
 * - Toggle to enable/disable auto-refresh
 * - Interval input (how many rounds between refreshes)
 * - Displays countdown to next refresh
 * 
 * When auto-refresh is enabled, new predictions are generated every N rounds.
 * When disabled (Manual mode), user must click "Select" to apply predictions.
 * 
 * @component
 * @returns {preact.VNode} Auto-refresh controls
 * 
 * @example
 * <AutoRefreshControl />
 */
export function AutoRefreshControl() {
  const [autoRefresh, setAutoRefresh] = useState(state.generatorAutoRefresh || false);
  const [interval, setInterval] = useState(state.generatorInterval || 5);

  // Sync with global state on mount
  useEffect(() => {
    setAutoRefresh(state.generatorAutoRefresh || false);
    setInterval(state.generatorInterval || 5);
  }, []);

  const handleToggleChange = (checked) => {
    setAutoRefresh(checked);
    state.generatorAutoRefresh = checked;
    saveGeneratorSettings();
  };

  const handleIntervalChange = (value) => {
    const clampedValue = Math.max(1, Math.min(20, value));
    setInterval(clampedValue);
    state.generatorInterval = clampedValue;
    saveGeneratorSettings();
  };

  return (
    <div style={{
      marginBottom: SPACING.sm,
      padding: SPACING.sm,
      background: COLORS.bg.dark,
      borderRadius: BORDER_RADIUS.sm
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '6px'
      }}>
        <span style={{ color: COLORS.text.secondary, fontSize: '10px' }}>
          Auto-Refresh:
        </span>
        <ToggleSwitch
          checked={autoRefresh}
          onChange={(e) => handleToggleChange(e.target.checked)}
          dotId="generator-autorefresh-dot"
        />
      </div>

      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        marginTop: '4px'
      }}>
        <span style={{
          color: COLORS.text.secondary,
          fontSize: '9px',
          whiteSpace: 'nowrap'
        }}>
          Every
        </span>
        <NumberInput
          value={interval}
          onChange={handleIntervalChange}
          min={1}
          max={20}
          step={1}
          width="50px"
          disabled={!autoRefresh}
          opacity={autoRefresh ? 1 : 0.5}
        />
        <span style={{
          color: COLORS.text.secondary,
          fontSize: '9px',
          whiteSpace: 'nowrap'
        }}>
          rounds
        </span>
      </div>

      <div style={{
        marginTop: '6px',
        fontSize: '8px',
        color: COLORS.text.tertiary,
        textAlign: 'center'
      }}>
        {autoRefresh ? (
          <>
            {state.currentHistory?.length - state.generatorLastRefresh < interval ? (
              <span style={{ color: COLORS.accent.info }}>
                Next refresh in {interval - (state.currentHistory?.length - state.generatorLastRefresh)} rounds
              </span>
            ) : (
              <span style={{ color: COLORS.accent.success }}>Ready to refresh</span>
            )}
          </>
        ) : (
          <span>Manual mode - click Select to apply</span>
        )}
      </div>
    </div>
  );
}
