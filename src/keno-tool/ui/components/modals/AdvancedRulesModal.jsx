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
 * Phase 3: Multiple conditions with AND/OR logic
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
  const [logic, setLogic] = useState(
    state.generatorAdvancedRules?.logic || 'OR'
  );
  const [conditions, setConditions] = useState(
    state.generatorAdvancedRules?.conditions?.length > 0
      ? state.generatorAdvancedRules.conditions
      : [{
          id: 1,
          action: 'switch',
          metric: 'betsLost',
          operator: '>=',
          value: 3,
          rounds: 5
        }]
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
      setLogic(state.generatorAdvancedRules.logic || 'OR');
      
      if (state.generatorAdvancedRules.conditions?.length > 0) {
        setConditions(state.generatorAdvancedRules.conditions);
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

  const handleConditionChange = (id, newCondition) => {
    const updatedConditions = conditions.map(c => 
      c.id === id ? newCondition : c
    );
    setConditions(updatedConditions);
    
    state.generatorAdvancedRules = {
      ...state.generatorAdvancedRules,
      conditions: updatedConditions
    };
    
    saveGeneratorSettings();
  };

  const handleAddCondition = () => {
    const newId = Math.max(...conditions.map(c => c.id), 0) + 1;
    const newCondition = {
      id: newId,
      action: 'switch',
      metric: 'betsLost',
      operator: '>=',
      value: 3,
      rounds: 5
    };
    
    const updatedConditions = [...conditions, newCondition];
    setConditions(updatedConditions);
    
    state.generatorAdvancedRules = {
      ...state.generatorAdvancedRules,
      conditions: updatedConditions
    };
    
    saveGeneratorSettings();
  };

  const handleDeleteCondition = (id) => {
    if (conditions.length === 1) return; // Keep at least one
    
    const updatedConditions = conditions.filter(c => c.id !== id);
    setConditions(updatedConditions);
    
    state.generatorAdvancedRules = {
      ...state.generatorAdvancedRules,
      conditions: updatedConditions
    };
    
    saveGeneratorSettings();
  };

  const handleLogicChange = (e) => {
    const newLogic = e.target.value;
    setLogic(newLogic);
    
    state.generatorAdvancedRules = {
      ...state.generatorAdvancedRules,
      logic: newLogic
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

              {/* Logic operator (only show if multiple conditions) */}
              {conditions.length > 1 && (
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
                    Logic Operator:
                  </div>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}>
                    <select
                      value={logic}
                      onChange={handleLogicChange}
                      style={{
                        padding: '6px 10px',
                        background: COLORS.bg.dark,
                        color: COLORS.text.primary,
                        border: `1px solid ${COLORS.border.light}`,
                        borderRadius: BORDER_RADIUS.xs,
                        fontSize: '10px',
                        fontWeight: '600',
                        flex: 1
                      }}
                    >
                      <option value="AND">AND (all must match)</option>
                      <option value="OR">OR (any can match)</option>
                    </select>
                  </div>
                </div>
              )}

              {/* Conditions list */}
              <div style={{ marginBottom: SPACING.md }}>
                <div style={{
                  fontSize: '11px',
                  color: COLORS.text.secondary,
                  marginBottom: '6px',
                  fontWeight: '600',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <span>Conditions ({conditions.length}):</span>
                </div>
                
                {conditions.map((cond, index) => (
                  <div key={cond.id} style={{
                    marginBottom: '8px',
                    position: 'relative'
                  }}>
                    {conditions.length > 1 && index > 0 && (
                      <div style={{
                        fontSize: '9px',
                        color: COLORS.text.muted,
                        textAlign: 'center',
                        padding: '4px 0',
                        fontWeight: '600'
                      }}>
                        {logic}
                      </div>
                    )}
                    
                    <div style={{
                      position: 'relative',
                      paddingRight: conditions.length > 1 ? '30px' : '0'
                    }}>
                      <ConditionBuilder
                        condition={cond}
                        onChange={(newCond) => handleConditionChange(cond.id, newCond)}
                      />
                      
                      {conditions.length > 1 && (
                        <button
                          onClick={() => handleDeleteCondition(cond.id)}
                          style={{
                            position: 'absolute',
                            top: '50%',
                            right: '4px',
                            transform: 'translateY(-50%)',
                            background: COLORS.error,
                            color: COLORS.text.primary,
                            border: 'none',
                            borderRadius: BORDER_RADIUS.xs,
                            width: '20px',
                            height: '20px',
                            fontSize: '12px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: 0
                          }}
                          onMouseOver={(e) => {
                            e.currentTarget.style.background = COLORS.error + 'dd';
                          }}
                          onMouseOut={(e) => {
                            e.currentTarget.style.background = COLORS.error;
                          }}
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  </div>
                ))}
                
                {/* Add condition button */}
                <button
                  onClick={handleAddCondition}
                  style={{
                    width: '100%',
                    padding: '8px',
                    marginTop: '8px',
                    background: COLORS.bg.darker,
                    color: COLORS.accent.blue,
                    border: `1px dashed ${COLORS.accent.blue}`,
                    borderRadius: BORDER_RADIUS.xs,
                    fontSize: '10px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '4px'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.background = COLORS.accent.blue + '22';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.background = COLORS.bg.darker;
                  }}
                >
                  <span style={{ fontSize: '12px' }}>+</span> Add Condition
                </button>
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
                    If {logic === 'AND' ? 'not all conditions match' : 'no conditions match'}:
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

              {/* Preview display */}
              <div style={{
                fontSize: '10px',
                color: COLORS.text.primary,
                padding: SPACING.sm,
                background: COLORS.bg.darker,
                borderRadius: BORDER_RADIUS.sm,
                borderLeft: `3px solid ${COLORS.accent.blue}`
              }}>
                <div style={{ 
                  color: COLORS.text.muted, 
                  fontSize: '9px',
                  marginBottom: '4px',
                  fontWeight: '600'
                }}>
                  Rule Summary:
                </div>
                {conditions.map((cond, index) => (
                  <div key={cond.id} style={{ 
                    marginBottom: index < conditions.length - 1 ? '4px' : '0',
                    paddingLeft: '8px'
                  }}>
                    <div style={{
                      fontWeight: '600',
                      color: cond.action === 'stay' ? COLORS.success : COLORS.error
                    }}>
                      {index > 0 && (
                        <span style={{ color: COLORS.text.muted, fontWeight: 'normal' }}>
                          {logic}{' '}
                        </span>
                      )}
                      {getConditionPreviewText(cond)}
                    </div>
                  </div>
                ))}
                {conditions.length > 1 && (
                  <div style={{
                    marginTop: '6px',
                    paddingTop: '6px',
                    borderTop: `1px solid ${COLORS.border.light}`,
                    fontSize: '9px',
                    color: COLORS.text.muted,
                    fontStyle: 'italic'
                  }}>
                    Otherwise: {defaultAction === 'stay' ? 'Keep current numbers' : 'Switch to new numbers'}
                  </div>
                )}
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
