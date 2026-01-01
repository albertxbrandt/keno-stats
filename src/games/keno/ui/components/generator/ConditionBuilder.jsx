// src/keno-tool/ui/components/generator/ConditionBuilder.jsx
// Single condition builder for advanced refresh rules

import { useState, useEffect } from 'preact/hooks';
import { NumberInput } from '../shared/NumberInput.jsx';
import { COLORS } from '@/shared/constants/colors.js';
import { BORDER_RADIUS, SPACING } from '@/shared/constants/styles.js';

/**
 * ConditionBuilder Component
 * 
 * Builds a single condition: "Switch if lost >= 3 bets over last 5 rounds"
 * Phase 2: Supports all metrics (win/loss, profit, hit/miss, streaks)
 * 
 * @component
 * @param {Object} props
 * @param {Object} props.condition - Condition object { action, metric, operator, value, rounds }
 * @param {Function} props.onChange - Callback when condition changes
 * @returns {preact.VNode}
 */
export function ConditionBuilder({ condition, onChange }) {
  const [action, setAction] = useState(condition?.action || 'switch');
  const [metric, setMetric] = useState(condition?.metric || 'betsLost');
  const [operator, setOperator] = useState(condition?.operator || '>=');
  const [value, setValue] = useState(condition?.value || 3);
  const [rounds, setRounds] = useState(condition?.rounds || 5);

  // Metric metadata for validation and display
  const metricConfig = {
    // Win/Loss metrics
    betsWon: { label: 'Bets Won', unit: 'bets', max: 999, isPercentage: false, usesRounds: true },
    betsLost: { label: 'Bets Lost', unit: 'bets', max: 999, isPercentage: false, usesRounds: true },
    winRate: { label: 'Win Rate', unit: '%', max: 100, isPercentage: true, usesRounds: true },
    
    // Profit metrics
    totalProfit: { label: 'Total Profit', unit: '$', max: 9999, isPercentage: false, usesRounds: true },
    averageProfit: { label: 'Average Profit', unit: '$', max: 9999, isPercentage: false, usesRounds: true },
    profitStreak: { label: 'Profit Streak', unit: 'rounds', max: 99, isPercentage: false, usesRounds: false },
    lossStreak: { label: 'Loss Streak', unit: 'rounds', max: 99, isPercentage: false, usesRounds: false },
    
    // Hit/Miss metrics
    totalHits: { label: 'Total Hits', unit: 'hits', max: 999, isPercentage: false, usesRounds: true },
    totalMisses: { label: 'Total Misses', unit: 'misses', max: 999, isPercentage: false, usesRounds: true },
    hitRate: { label: 'Hit Rate', unit: '%', max: 100, isPercentage: true, usesRounds: true },
    averageHits: { label: 'Average Hits', unit: 'hits', max: 40, isPercentage: false, usesRounds: true }
  };

  const currentConfig = metricConfig[metric];

  // Sync with parent
  useEffect(() => {
    onChange({
      id: condition?.id || 1,
      action,
      metric,
      operator,
      value,
      rounds
    });
  }, [action, metric, operator, value, rounds]);

  const handleActionChange = (e) => {
    setAction(e.target.value);
  };

  const handleMetricChange = (e) => {
    const newMetric = e.target.value;
    setMetric(newMetric);
    
    // Reset value to sensible default for new metric
    const config = metricConfig[newMetric];
    if (config?.isPercentage) {
      setValue(50); // Default 50% for percentage metrics
    } else if (newMetric.includes('Streak')) {
      setValue(3); // Default 3 for streak metrics
    } else if (newMetric.includes('Profit')) {
      setValue(5); // Default $5 for profit metrics
    } else {
      setValue(3); // Default 3 for count metrics
    }
  };

  const handleOperatorChange = (e) => {
    setOperator(e.target.value);
  };

  const handleValueChange = (newValue) => {
    const config = metricConfig[metric];
    const clampedValue = Math.max(0, Math.min(config?.max || 999, newValue));
    setValue(clampedValue);
  };

  const handleRoundsChange = (newValue) => {
    setRounds(Math.max(1, Math.min(20, newValue)));
  };

  // Get display text for metric unit
  const getUnitText = () => {
    const config = metricConfig[metric];
    if (!config) return 'bets';
    
    if (config.isPercentage) return '%';
    return config.unit;
  };

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
      flexWrap: 'wrap',
      padding: SPACING.sm,
      background: COLORS.bg.dark,
      borderRadius: BORDER_RADIUS.sm,
      fontSize: '10px'
    }}>
      {/* Action */}
      <select
        value={action}
        onChange={handleActionChange}
        style={{
          padding: '4px 6px',
          background: COLORS.bg.darker,
          color: action === 'stay' ? COLORS.success : COLORS.error,
          border: `1px solid ${COLORS.border.light}`,
          borderRadius: BORDER_RADIUS.xs,
          fontSize: '10px',
          fontWeight: '600'
        }}
      >
        <option value="stay">Stay</option>
        <option value="switch">Switch</option>
      </select>

      <span style={{ color: COLORS.text.secondary }}>if</span>

      {/* Metric */}
      <select
        value={metric}
        onChange={handleMetricChange}
        style={{
          padding: '4px 6px',
          background: COLORS.bg.darker,
          color: COLORS.text.primary,
          border: `1px solid ${COLORS.border.light}`,
          borderRadius: BORDER_RADIUS.xs,
          fontSize: '10px'
        }}
      >
        <optgroup label="Win/Loss">
          <option value="betsWon">Bets Won</option>
          <option value="betsLost">Bets Lost</option>
          <option value="winRate">Win Rate</option>
        </optgroup>
        <optgroup label="Profit">
          <option value="totalProfit">Total Profit</option>
          <option value="averageProfit">Average Profit</option>
          <option value="profitStreak">Profit Streak</option>
          <option value="lossStreak">Loss Streak</option>
        </optgroup>
        <optgroup label="Hits">
          <option value="totalHits">Total Hits</option>
          <option value="totalMisses">Total Misses</option>
          <option value="hitRate">Hit Rate</option>
          <option value="averageHits">Average Hits</option>
        </optgroup>
      </select>

      {/* Operator */}
      <select
        value={operator}
        onChange={handleOperatorChange}
        style={{
          padding: '4px 6px',
          background: COLORS.bg.darker,
          color: COLORS.text.primary,
          border: `1px solid ${COLORS.border.light}`,
          borderRadius: BORDER_RADIUS.xs,
          fontSize: '10px'
        }}
      >
        <option value=">">is greater than</option>
        <option value=">=">is greater than or equal to</option>
        <option value="<">is less than</option>
        <option value="<=">is less than or equal to</option>
        <option value="==">equals</option>
      </select>

      {/* Value */}
      <NumberInput
        value={value}
        onChange={handleValueChange}
        min={0}
        max={currentConfig?.max || 999}
        step={currentConfig?.isPercentage ? 1 : 1}
        width="50px"
      />

      <span style={{ color: COLORS.text.secondary }}>
        {getUnitText()}
        {currentConfig?.usesRounds ? ' over the last' : ''}
      </span>

      {/* Rounds (only for metrics that use lookback period) */}
      {currentConfig?.usesRounds && (
        <>
          <NumberInput
            value={rounds}
            onChange={handleRoundsChange}
            min={1}
            max={20}
            step={1}
            width="50px"
          />

          <span style={{ color: COLORS.text.secondary }}>rounds</span>
        </>
      )}
    </div>
  );
}
