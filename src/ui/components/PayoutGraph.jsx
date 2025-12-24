// src/ui/components/PayoutGraph.jsx
// Reusable payout distribution graph component

import { h } from 'preact';
import { useMemo } from 'preact/hooks';
import { calculateHitDistribution, getPayoutMultipliers, getBarColor } from '../../utils/calculations/payoutCalculations.js';

/**
 * PayoutGraph - Displays payout distribution for a number combination
 * @param {Object} props
 * @param {Array<number>} props.numbers - Numbers to analyze
 * @param {Array} props.history - Round history data
 * @param {Object} props.betMultipliers - Bet multipliers configuration
 * @param {string} props.riskMode - Risk mode (classic, low, medium, high)
 * @param {number} props.lookback - Number of rounds to analyze
 */
export function PayoutGraph({ numbers, history, betMultipliers, riskMode = 'high', lookback = 50 }) {
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
      background: '#0f212e',
      padding: '15px',
      borderRadius: '8px',
      marginBottom: '15px'
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '10px'
      }}>
        <h3 style={{ color: '#74b9ff', fontSize: '14px', margin: 0 }}>
          Payout Distribution
        </h3>
      </div>

      {/* Subtitle */}
      <div style={{ color: '#666', fontSize: '11px', marginBottom: '12px' }}>
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
              <div style={{ width: '50px', textAlign: 'right', color: '#888', fontSize: '11px' }}>
                {hitCount}/{numCount}
              </div>

              {/* Bar */}
              <div style={{
                flex: 1,
                background: '#14202b',
                borderRadius: '4px',
                height: '24px',
                position: 'relative',
                overflow: 'hidden'
              }}>
                {barWidth > 0 && (
                  <div style={{
                    width: `${barWidth}%`,
                    height: '100%',
                    background: barColor,
                    borderRadius: '4px'
                  }} />
                )}
              </div>

              {/* Percentage */}
              <div style={{
                width: '60px',
                textAlign: 'right',
                color: '#fff',
                fontSize: '11px',
                fontWeight: 'bold'
              }}>
                {percentage}%
              </div>

              {/* Payout multiplier */}
              <div style={{
                width: '50px',
                textAlign: 'right',
                color: payout > 0 ? '#00b894' : '#666',
                fontSize: '11px'
              }}>
                {payout}x
              </div>

              {/* Count */}
              <div style={{
                width: '40px',
                textAlign: 'right',
                color: '#666',
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
        borderTop: '1px solid #1a2c38',
        fontSize: '10px',
        color: '#666'
      }}>
        <span>Hits / Total</span>
        <span>Frequency</span>
        <span>Payout</span>
        <span>Count</span>
      </div>
    </div>
  );
}
