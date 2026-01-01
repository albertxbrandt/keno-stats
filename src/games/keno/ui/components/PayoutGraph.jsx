// src/ui/components/PayoutGraph.jsx
// Reusable payout distribution graph component

import { h } from 'preact';
import { useMemo } from 'preact/hooks';
import { calculateHitDistribution, getPayoutMultipliers, getBarColor } from '@/shared/utils/calculations/payoutCalculations.js';
import { COLORS } from '@/shared/constants/colors.js';
import { BORDER_RADIUS, SPACING } from '@/shared/constants/styles.js';
import { DEFAULTS } from '@/shared/constants/defaults.js';

/**
 * PayoutGraph - Displays payout distribution for a number combination
 * @param {Object} props
 * @param {Array<number>} props.numbers - Numbers to analyze
 * @param {Array} props.history - Round history data
 * @param {Object} props.betMultipliers - Bet multipliers configuration
 * @param {string} props.riskMode - Risk mode (classic, low, medium, high)
 * @param {number} props.lookback - Number of rounds to analyze
 */
export function PayoutGraph({ numbers, history, betMultipliers, riskMode = DEFAULTS.riskMode, lookback = DEFAULTS.lookback }) {
  // Calculate distribution data (memoized to avoid recalculation on re-renders)
  const { hitCounts, hitPercentages, analyzedCount } = useMemo(() => {
    return calculateHitDistribution(numbers, history, lookback);
  }, [numbers, history, lookback]);

  // Get payout multipliers
  const payouts = useMemo(() => {
    return getPayoutMultipliers(betMultipliers, riskMode, numbers.length);
  }, [betMultipliers, riskMode, numbers.length]);

  if (!betMultipliers) {
    return (
      <div style={{ color: '#666', textAlign: 'center', padding: '20px' }}>
        Loading payout data...
      </div>
    );
  }

  const numCount = numbers.length;

  return (
    <div className="payout-graph-wrapper" style={{
      background: COLORS.bg.dark,
      padding: SPACING.lg,
      borderRadius: BORDER_RADIUS.lg,
      marginBottom: SPACING.lg
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '10px'
      }}>
        <h3 style={{ color: COLORS.accent.info, fontSize: '14px', margin: 0 }}>
          Payout Distribution
        </h3>
      </div>

      {/* Subtitle */}
      <div style={{ color: COLORS.text.tertiary, fontSize: '11px', marginBottom: '12px' }}>
        Based on last {analyzedCount} rounds ({riskMode} risk)
      </div>

      {/* Bar chart */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {Array.from({ length: numCount + 1 }, (_, i) => numCount - i).map((hitCount) => {
          const count = hitCounts[hitCount];
          const percentage = hitPercentages[hitCount];
          const payout = payouts[hitCount] || 0;
          const barWidth = percentage > 0 ? Math.max(percentage, 5) : 0;
          const barColor = getBarColor(hitCount, numCount);

          return (
            <div key={hitCount} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {/* Hit label */}
              <div style={{ width: '50px', textAlign: 'right', color: COLORS.text.secondary, fontSize: '11px' }}>
                {hitCount}/{numCount}
              </div>

              {/* Bar */}
              <div style={{
                flex: 1,
                background: COLORS.bg.darkest,
                borderRadius: BORDER_RADIUS.sm,
                height: '24px',
                position: 'relative',
                overflow: 'hidden'
              }}>
                {barWidth > 0 && (
                  <div style={{
                    width: `${barWidth}%`,
                    height: '100%',
                    background: barColor,
                    borderRadius: BORDER_RADIUS.sm
                  }} />
                )}
              </div>

              {/* Percentage */}
              <div style={{
                width: '60px',
                textAlign: 'right',
                color: COLORS.text.primary,
                fontSize: '11px',
                fontWeight: 'bold'
              }}>
                {percentage}%
              </div>

              {/* Payout multiplier */}
              <div style={{
                width: '50px',
                textAlign: 'right',
                color: payout > 0 ? COLORS.accent.success : COLORS.text.tertiary,
                fontSize: '11px'
              }}>
                {payout}x
              </div>

              {/* Count */}
              <div style={{
                width: '40px',
                textAlign: 'right',
                color: COLORS.text.tertiary,
                fontSize: '10px'
              }}>
                {count}
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer labels */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        marginTop: '12px',
        paddingTop: '10px',
        borderTop: `1px solid ${COLORS.border.lighter}`,
        fontSize: '10px',
        color: COLORS.text.tertiary
      }}>
        <span>Hits / Total</span>
        <span>Frequency</span>
        <span>Payout</span>
        <span>Count</span>
      </div>
    </div>
  );
}
