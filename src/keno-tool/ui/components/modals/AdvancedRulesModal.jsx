// src/keno-tool/ui/components/modals/AdvancedRulesModal.jsx
// Modal for configuring advanced refresh rules

import { useState, useEffect } from 'preact/hooks';
import { state } from '@/keno-tool/core/state.js';
import { saveGeneratorSettings } from '@/keno-tool/core/storage.js';
import { ToggleSwitch } from '../shared/ToggleSwitch.jsx';
import { ConditionBuilder } from '../generator/ConditionBuilder.jsx';
import { COLORS } from '@/shared/constants/colors.js';
import { BORDER_RADIUS, SPACING } from '@/shared/constants/styles.js';

/**
 * AdvancedRulesModal Component
 * 
 * Modal for configuring advanced refresh rules
 * Phase 2: All metrics supported
 * 
 * @component
 * @param {Object} props
 * @param {Function} props.onClose - Callback when modal closes
 * @returns {preact.VNode}
 */
export function AdvancedRulesModal({ onClose }) {
  const [enabled, setEnabled] = useState(state.generatorAdvancedRules?.enabled || false);
  const [defaultAction, setDefaultAction] = useState(
    state.generatorAdvancedRules?.defaultAction || 'switch'
  );
  const [condition, setCondition] = useState(
    state.generatorAdvancedRules?.conditions?.[0] || {
      id: 1,
      action: 'switch',
      metric: 'betsLost',
      operator: '>=',
      value: 3,
      rounds: 5
    }
  );

  // Helper function to get human-readable condition text
  const getConditionPreviewText = (cond) => {
    const actionText = cond.action === 'stay' ? '✓ Keep' : '↻ Switch';
    
    const metricLabels = {
      betsWon: 'bets won',
      betsLost: 'bets lost',
      winRate: 'win rate',
      totalProfit: 'total profit',
      averageProfit: 'average profit',
      profitStreak: 'profit streak',
      lossStreak: 'loss streak',
      totalHits: 'total hits',
      totalMisses: 'total misses',
      hitRate: 'hit rate',
      averageHits: 'average hits'
    };
    
    const operatorLabels = {
      '>': 'greater than',
      '>=': 'greater than or equal to',
      '<': 'less than',
      '<=': 'less than or equal to',
      '==': 'equals'
    };
    
    const metricLabel = metricLabels[cond.metric] || cond.metric;
    const operatorLabel = operatorLabels[cond.operator] || cond.operator;
    
    // Add unit suffix
    let valueText = cond.value;
    if (cond.metric.includes('Rate')) valueText += '%';
    else if (cond.metric.includes('Profit')) valueText = '$' + valueText;
    else if (cond.metric.includes('Streak')) valueText += ' rounds';
    
    // Add lookback period for non-streak metrics
    const usesRounds = !cond.metric.includes('Streak');
    const roundsText = usesRounds ? ` over last ${cond.rounds} round${cond.rounds !== 1 ? 's' : ''}` : '';
    
    return `${actionText} if ${metricLabel} is ${operatorLabel} ${valueText}${roundsText}`;
  };

  // Sync with global state on mount
  useEffect(() => {
    if (state.generatorAdvancedRules) {
      setEnabled(state.generatorAdvancedRules.enabled || false);
      setDefaultAction(state.generatorAdvancedRules.defaultAction || 'switch');
      
      if (state.generatorAdvancedRules.conditions?.length > 0) {
        setCondition(state.generatorAdvancedRules.conditions[0]);
      }
    }
  }, []);

  const handleEnableToggle = (checked) => {
    setEnabled(checked);
    
    state.generatorAdvancedRules = {
      ...state.generatorAdvancedRules,
      enabled: checked
    };
    
    saveGeneratorSettings();
  };

  const handleConditionChange = (newCondition) => {
    setCondition(newCondition);
    
    state.generatorAdvancedRules = {
      ...state.generatorAdvancedRules,
      conditions: [newCondition]
    };
    
    saveGeneratorSettings();
  };

  const handleDefaultActionChange = (e) => {
    const action = e.target.value;
    setDefaultAction(action);
    
    state.generatorAdvancedRules = {
      ...state.generatorAdvancedRules,
      defaultAction: action
    };
    
    saveGeneratorSettings();
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.8)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10000,
        padding: '20px'
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: COLORS.bg.dark,
          borderRadius: BORDER_RADIUS.md,
          border: `1px solid ${COLORS.border.medium}`,
          maxWidth: '600px',
          width: '100%',
          maxHeight: '80vh',
          overflow: 'auto',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{
          padding: SPACING.md,
          borderBottom: `1px solid ${COLORS.border.light}`,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <h3 style={{
            margin: 0,
            fontSize: '14px',
            fontWeight: '600',
            color: COLORS.text.primary
          }}>
            Advanced Refresh Rules
          </h3>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: COLORS.text.muted,
              cursor: 'pointer',
              fontSize: '20px',
              padding: '0 8px',
              lineHeight: 1
            }}
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: SPACING.md }}>
          {/* Master toggle */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: SPACING.md,
            padding: SPACING.sm,
            background: COLORS.bg.darker,
            borderRadius: BORDER_RADIUS.sm
          }}>
            <div>
              <div style={{ 
                color: COLORS.text.primary, 
                fontSize: '12px',
                fontWeight: '600',
                marginBottom: '4px'
              }}>
                Enable Advanced Rules
              </div>
              <div style={{ 
                color: COLORS.text.muted, 
                fontSize: '9px'
              }}>
                Overrides simple mode controls when enabled
              </div>
            </div>
            <ToggleSwitch
              checked={enabled}
              onChange={(e) => handleEnableToggle(e.target.checked)}
              dotId="advanced-rules-modal-toggle"
            />
          </div>

          {enabled && (
            <>
              {/* Info banner */}
              <div style={{
                fontSize: '10px',
                color: COLORS.accent.blue,
                marginBottom: SPACING.md,
                padding: SPACING.sm,
                background: COLORS.accent.blue + '22',
                borderRadius: BORDER_RADIUS.sm,
                border: `1px solid ${COLORS.accent.blue}`,
                display: 'flex',
                gap: '8px',
                alignItems: 'center'
              }}>
                <span style={{ fontSize: '14px' }}>ℹ️</span>
                <span>
                  Advanced mode checks conditions <strong>every round</strong> and acts immediately when met, ignoring the simple mode interval and "Stay if Profitable" toggle.
                </span>
              </div>

              {/* Condition builder */}
              <div style={{ marginBottom: SPACING.md }}>
                <div style={{
                  fontSize: '11px',
                  color: COLORS.text.secondary,
                  marginBottom: '6px',
                  fontWeight: '600'
                }}>
                  Condition:
                </div>
                <ConditionBuilder
                  condition={condition}
                  onChange={handleConditionChange}
                />
              </div>

              {/* Default action */}
              <div style={{
                marginBottom: SPACING.md,
                padding: SPACING.sm,
                background: COLORS.bg.darker,
                borderRadius: BORDER_RADIUS.sm
              }}>
                <div style={{
                  fontSize: '11px',
                  color: COLORS.text.secondary,
                  marginBottom: '6px',
                  fontWeight: '600'
                }}>
                  Default Behavior:
                </div>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '10px'
                }}>
                  <span style={{ color: COLORS.text.secondary }}>
                    If condition not met:
                  </span>
                  <select
                    value={defaultAction}
                    onChange={handleDefaultActionChange}
                    style={{
                      padding: '4px 8px',
                      background: COLORS.bg.dark,
                      color: defaultAction === 'stay' ? COLORS.success : COLORS.error,
                      border: `1px solid ${COLORS.border.light}`,
                      borderRadius: BORDER_RADIUS.xs,
                      fontSize: '10px',
                      fontWeight: '600',
                      flex: 1
                    }}
                  >
                    <option value="switch">Switch to new numbers</option>
                    <option value="stay">Keep current numbers</option>
                  </select>
                </div>
              </div>

              {/* Example display */}
              <div style={{
                fontSize: '10px',
                color: COLORS.text.primary,
                padding: SPACING.sm,
                background: COLORS.bg.darker,
                borderRadius: BORDER_RADIUS.sm,
                borderLeft: `3px solid ${condition.action === 'stay' ? COLORS.success : COLORS.error}`
              }}>
                <div style={{ 
                  color: COLORS.text.muted, 
                  fontSize: '9px',
                  marginBottom: '4px'
                }}>
                  Current Rule:
                </div>
                <div style={{ fontWeight: '600' }}>
                  {getConditionPreviewText(condition)}
                </div>
              </div>
            </>
          )}

          {!enabled && (
            <div style={{
              fontSize: '10px',
              color: COLORS.text.muted,
              fontStyle: 'italic',
              padding: SPACING.md,
              textAlign: 'center',
              background: COLORS.bg.darker,
              borderRadius: BORDER_RADIUS.sm
            }}>
              Enable to define custom conditions for auto-refresh behavior
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: SPACING.md,
          borderTop: `1px solid ${COLORS.border.light}`,
          display: 'flex',
          justifyContent: 'flex-end'
        }}>
          <button
            onClick={onClose}
            style={{
              padding: '6px 16px',
              background: COLORS.primary,
              color: COLORS.text.primary,
              border: 'none',
              borderRadius: BORDER_RADIUS.sm,
              fontSize: '11px',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
