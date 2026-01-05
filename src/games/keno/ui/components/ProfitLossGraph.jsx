// src/ui/components/ProfitLossGraph.jsx
// Profit/Loss line graph showing cumulative performance

import { h } from 'preact';
import { useMemo } from 'preact/hooks';
import { getDrawn } from '@/games/keno/core/storage.js';
import { COLORS } from '@/shared/constants/colors.js';
import { BORDER_RADIUS, SPACING } from '@/shared/constants/styles.js';
import { DEFAULTS } from '@/shared/constants/defaults.js';
import { TrendingUp, TrendingDown } from 'lucide-preact';

/**
 * ProfitLossGraph - Displays cumulative profit/loss line graph
 * @param {Object} props
 * @param {Array<number>} props.numbers - Numbers to analyze
 * @param {Array} props.history - Round history data
 * @param {Object} props.betMultipliers - Bet multipliers configuration
 * @param {string} props.riskMode - Risk mode (classic, low, medium, high)
 * @param {number} props.lookback - Number of rounds to analyze
 */
export function ProfitLossGraph({ numbers, history, betMultipliers, riskMode = DEFAULTS.riskMode, lookback = DEFAULTS.lookback }) {
  // Calculate profit/loss data (memoized)
  const graphData = useMemo(() => {
    if (!betMultipliers || !history || history.length === 0) {
      return { points: [], totalPL: 0, wins: 0, losses: 0, winRate: 0 };
    }

    const recentHistory = history.slice(-lookback);
    const numberCount = numbers.length;

    // Calculate hit counts for each bet in the lookback period
    const hitCounts = recentHistory.map(round => {
      const drawnNumbers = getDrawn(round);
      return numbers.filter(num => drawnNumbers.includes(num)).length;
    });

    // Get payout data for this risk mode and number count
    const modeData = betMultipliers[riskMode];
    const payouts = (modeData && modeData[numberCount]) ? modeData[numberCount] : {};

    // Convert hit counts to multipliers, then to profit/loss (multiplier - 1)
    const multipliers = hitCounts.map(hits => payouts[hits] || 0);
    const profitLoss = multipliers.map(mult => mult - 1); // -1 = lost bet, +X = profit

    // Calculate cumulative profit/loss
    let cumulative = 0;
    const cumulativePL = profitLoss.map(pl => {
      cumulative += pl;
      return cumulative;
    });

    // Create point data
    const points = cumulativePL.map((cumPL, i) => ({
      cumPL,
      pl: profitLoss[i],
      mult: multipliers[i],
      hits: hitCounts[i],
      betNumber: history.length - lookback + i + 1
    }));

    // Calculate stats
    const totalPL = cumulative;
    const wins = profitLoss.filter(pl => pl > 0).length;
    const winRate = profitLoss.length > 0 ? ((wins / profitLoss.length) * 100).toFixed(1) : '0.0';

    return { points, totalPL, wins, winRate };
  }, [numbers, history, betMultipliers, riskMode, lookback]);

  if (!betMultipliers) {
    return (
      <div style={{ color: COLORS.text.tertiary, textAlign: 'center', padding: '20px' }}>
        Loading payout data...
      </div>
    );
  }

  if (graphData.points.length === 0) {
    return (
      <div style={{ color: COLORS.text.tertiary, textAlign: 'center', padding: '20px' }}>
        No data available for selected range.
      </div>
    );
  }

  const { points, totalPL, wins, winRate } = graphData;

  // Calculate graph dimensions
  const graphWidth = 450;
  const graphHeight = 180;
  const padding = { top: 15, right: 15, bottom: 35, left: 55 };
  const innerWidth = graphWidth - padding.left - padding.right;
  const innerHeight = graphHeight - padding.top - padding.bottom;

  const maxValue = Math.max(...points.map(p => p.cumPL), 1);
  const minValue = Math.min(...points.map(p => p.cumPL), -1);
  const range = maxValue - minValue;
  const dataPoints = points.length;

  // Calculate zero line position
  const zeroY = padding.top + innerHeight * (maxValue / range);

  // Generate SVG coordinates
  const svgPoints = points.map((p, i) => {
    const x = padding.left + (i / Math.max(dataPoints - 1, 1)) * innerWidth;
    const y = padding.top + innerHeight - ((p.cumPL - minValue) / range) * innerHeight;
    return { ...p, x, y };
  });

  // Generate path data
  const pathData = svgPoints.length > 0
    ? `M ${svgPoints.map(p => `${p.x} ${p.y}`).join(' L ')}`
    : '';

  // Generate Y-axis labels
  const yAxisSteps = 5;
  const yAxisLabels = [];
  for (let i = 0; i <= yAxisSteps; i++) {
    const value = minValue + (range / yAxisSteps) * i;
    const y = padding.top + innerHeight - (i / yAxisSteps) * innerHeight;
    const color = value >= 0 ? '#00b894' : '#ff7675';
    yAxisLabels.push({ value, y, color });
  }

  // Generate X-axis labels
  const xStep = Math.max(Math.floor(dataPoints / 5), 1);
  const xAxisLabels = [];
  for (let i = 0; i < dataPoints; i += xStep) {
    const x = padding.left + (i / Math.max(dataPoints - 1, 1)) * innerWidth;
    const betNumber = points[i].betNumber;
    xAxisLabels.push({ x, betNumber });
  }

  return (
    <div style={{
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
        <h3 style={{ color: COLORS.accent.info, fontSize: '14px', margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
          <TrendingUp size={14} strokeWidth={2} />
          Cumulative Profit/Loss
        </h3>
      </div>

      {/* Stats summary */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr 1fr',
        gap: '10px',
        marginBottom: '15px',
        padding: '10px',
        background: COLORS.bg.darker,
        borderRadius: BORDER_RADIUS.md
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            color: totalPL >= 0 ? COLORS.accent.success : COLORS.accent.error,
            fontSize: '18px',
            fontWeight: 'bold'
          }}>
            {totalPL >= 0 ? '+' : ''}{totalPL.toFixed(2)}x
          </div>
          <div style={{ color: COLORS.text.tertiary, fontSize: '10px' }}>Total P/L</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ color: COLORS.accent.success, fontSize: '18px', fontWeight: 'bold' }}>
            {wins}
          </div>
          <div style={{ color: COLORS.text.tertiary, fontSize: '10px' }}>Wins</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ color: COLORS.accent.info, fontSize: '18px', fontWeight: 'bold' }}>
            {winRate}%
          </div>
          <div style={{ color: COLORS.text.tertiary, fontSize: '10px' }}>Win Rate</div>
        </div>
      </div>

      {/* Subtitle */}
      <div style={{ color: COLORS.text.tertiary, fontSize: '11px', marginBottom: '10px' }}>
        Based on last {points.length} rounds ({riskMode} risk)
      </div>

      {/* SVG Graph */}
      <svg
        width={graphWidth}
        height={graphHeight}
        style={{ display: 'block', margin: '0 auto' }}
      >
        {/* Y-axis grid lines and labels */}
        {yAxisLabels.map((label, i) => (
          <g key={i}>
            <line
              x1={padding.left}
              y1={label.y}
              x2={graphWidth - padding.right}
              y2={label.y}
              stroke={COLORS.border.light}
              strokeWidth="0.5"
              opacity="0.3"
            />
            <text
              x={padding.left - 5}
              y={label.y}
              textAnchor="end"
              dominantBaseline="middle"
              fill={label.color}
              fontSize="10"
            >
              {label.value >= 0 ? '+' : ''}{label.value.toFixed(1)}x
            </text>
          </g>
        ))}

        {/* Zero line */}
        <line
          x1={padding.left}
          y1={zeroY}
          x2={graphWidth - padding.right}
          y2={zeroY}
          stroke={COLORS.text.tertiary}
          strokeWidth="1.5"
          strokeDasharray="4,4"
        />
        <text
          x={padding.left - 5}
          y={zeroY}
          textAnchor="end"
          dominantBaseline="middle"
          fill={COLORS.text.secondary}
          fontSize="10"
          fontWeight="bold"
        >
          0x
        </text>

        {/* X-axis labels */}
        {xAxisLabels.map((label, i) => (
          <text
            key={i}
            x={label.x}
            y={graphHeight - 10}
            textAnchor="middle"
            fill={COLORS.text.tertiary}
            fontSize="9"
          >
            #{label.betNumber}
          </text>
        ))}

        {/* Line path */}
        <path
          d={pathData}
          stroke={totalPL >= 0 ? COLORS.accent.success : COLORS.accent.error}
          strokeWidth="2"
          fill="none"
        />

        {/* Data points */}
        {svgPoints.map((p, i) => {
          const color = p.pl > 0 ? COLORS.accent.success : p.pl < 0 ? COLORS.accent.error : COLORS.text.secondary;
          return (
            <circle
              key={i}
              cx={p.x}
              cy={p.y}
              r="3"
              fill={color}
              stroke={COLORS.text.primary}
              strokeWidth="1"
            >
              <title>
                Bet #{p.betNumber}: {p.hits} hits = {p.mult}x ({p.pl >= 0 ? '+' : ''}{p.pl.toFixed(2)}x profit)
              </title>
            </circle>
          );
        })}
      </svg>

      {/* Footer note */}
      <div style={{
        marginTop: '10px',
        paddingTop: '10px',
        borderTop: `1px solid ${COLORS.border.lighter}`,
        fontSize: '10px',
        color: COLORS.text.tertiary,
        textAlign: 'center'
      }}>
        Each point shows cumulative profit/loss. Green = win, Red = loss.
      </div>
    </div>
  );
}
