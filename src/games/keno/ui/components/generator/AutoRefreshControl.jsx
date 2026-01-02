// src/ui/components/generator/AutoRefreshControl.jsx
// Toggle and interval input for auto-refresh functionality

import { useState, useEffect } from 'preact/hooks';
import { state } from '@/games/keno/core/state.js';
import { saveGeneratorSettings } from '@/games/keno/core/storage.js';
import { ToggleSwitch } from '@/shared/components/ToggleSwitch.jsx';
import { NumberInput } from '@/shared/components/NumberInput.jsx';
import { AdvancedRulesSection } from './AdvancedRulesSection.jsx';
import { COLORS } from '@/shared/constants/colors.js';
import { BORDER_RADIUS, SPACING } from '@/shared/constants/styles.js';

/**
 * AutoRefreshControl Component
 * 
 * Controls for automatic prediction refresh with two modes:
 * 
 * SIMPLE MODE:
 * - Auto-refresh toggle + interval
 * - Stay if Profitable toggle
 * 
 * ADVANCED MODE:
 * - Condition-based rules (opens modal)
 * - Overrides simple mode when enabled
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
  const [stayIfProfitable, setStayIfProfitable] = useState(state.generatorStayIfProfitable || false);
  const [advancedEnabled, setAdvancedEnabled] = useState(state.generatorAdvancedRules?.enabled || false);

  // Sync with global state on mount
  useEffect(() => {
    setAutoRefresh(state.generatorAutoRefresh || false);
    setInterval(state.generatorInterval || 5);
    setStayIfProfitable(state.generatorStayIfProfitable || false);
    setAdvancedEnabled(state.generatorAdvancedRules?.enabled || false);
  }, []);

  const handleToggleChange = (checked) => {
    setAutoRefresh(checked);
    state.generatorAutoRefresh = checked;
    
    // Disable advanced rules if turning off auto-refresh
    if (!checked && advancedEnabled) {
      state.generatorAdvancedRules.enabled = false;
      setAdvancedEnabled(false);
    }
    
    saveGeneratorSettings();
  };

  const handleIntervalChange = (value) => {
    const clampedValue = Math.max(1, Math.min(20, value));
    setInterval(clampedValue);
    state.generatorInterval = clampedValue;
    saveGeneratorSettings();
  };

  const handleStayIfProfitableChange = (checked) => {
    setStayIfProfitable(checked);
    state.generatorStayIfProfitable = checked;
    saveGeneratorSettings();
  };

  // Simple mode is disabled when advanced rules are active
  const simpleDisabled = advancedEnabled;

  return (
    <div style={{
      marginBottom: SPACING.sm,
      padding: SPACING.sm,
      background: COLORS.bg.dark,
      borderRadius: BORDER_RADIUS.sm
    }}>
      {/* Master Auto-Refresh Toggle */}
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

      {autoRefresh && (
        <>
          {/* Mode Indicator */}
          <div style={{
            padding: '6px 8px',
            marginBottom: '8px',
            background: advancedEnabled ? COLORS.accent.blue + '22' : COLORS.bg.darker,
            borderRadius: BORDER_RADIUS.xs,
            border: `1px solid ${advancedEnabled ? COLORS.accent.blue : COLORS.border.light}`
          }}>
            <div style={{
              color: advancedEnabled ? COLORS.accent.blue : COLORS.text.secondary,
              fontSize: '9px',
              fontWeight: '600',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              {advancedEnabled ? '⚙️ Advanced Mode Active' : '✓ Simple Mode'}
            </div>
          </div>

          {/* Simple Mode Controls */}
          <div style={{
            opacity: simpleDisabled ? 0.4 : 1,
            pointerEvents: simpleDisabled ? 'none' : 'auto',
            transition: 'opacity 0.2s'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '8px'
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
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              paddingTop: '6px',
              borderTop: `1px solid ${COLORS.border.light}`
            }}>
              <span style={{
                color: COLORS.text.secondary,
                fontSize: '10px'
              }}>
                Stay if Profitable:
              </span>
              <ToggleSwitch
                checked={stayIfProfitable}
                onChange={(e) => handleStayIfProfitableChange(e.target.checked)}
                dotId="generator-stay-profitable-dot"
              />
            </div>
          </div>

          {/* Advanced Mode Button */}
          <div style={{
            marginTop: '8px',
            paddingTop: '8px',
            borderTop: `1px solid ${COLORS.border.light}`
          }}>
            <AdvancedRulesSection onToggle={setAdvancedEnabled} />
          </div>
        </>
      )}
    </div>
  );
}
