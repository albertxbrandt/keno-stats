// src/dashboard/components/BetDetailsModal.jsx
import { getHits, getMisses } from '@/shared/storage/history.js';
import { COLORS } from '@/shared/constants/colors.js';
import { BORDER_RADIUS, SPACING } from '@/shared/constants/styles.js';

/**
 * BetDetailsModal Component
 * Modal showing detailed information about a specific bet with visual board
 */
export function BetDetailsModal({ bet, onClose }) {
  if (!bet) return null;

  const kenoBet = bet.kenoBet || {};
  const hits = getHits(bet);
  const misses = getMisses(bet);
  const selected = kenoBet.state?.selectedNumbers || [];
  const drawn = kenoBet.state?.drawnNumbers || [];
  const profitLoss = (parseFloat(kenoBet.payout) || 0) - (parseFloat(kenoBet.amount) || 0);
  const isProfitable = profitLoss >= 0;

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  const DetailRow = ({ label, value, color }) => (
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      padding: SPACING.sm,
      borderBottom: `1px solid ${COLORS.border.default}`
    }}>
      <span style={{ color: COLORS.text.secondary }}>{label}:</span>
      <span style={{ color: color || COLORS.text.primary, fontWeight: 'bold' }}>{value}</span>
    </div>
  );

  // Render Keno board (8x5 grid, numbers 1-40)
  const renderBoard = () => {
    const tiles = [];
    for (let i = 1; i <= 40; i++) {
      const isSelected = selected.includes(i);
      const isHit = hits.includes(i);
      const isDrawn = drawn.includes(i);

      let backgroundColor, color;
      if (isHit) {
        // Green for hits
        backgroundColor = COLORS.accent.success;
        color = '#fff';
      } else if (isSelected) {
        // Purple for selected but not drawn
        backgroundColor = '#7b2cbf';
        color = '#fff';
      } else if (isDrawn) {
        // Red for drawn but not selected (misses)
        backgroundColor = COLORS.accent.error;
        color = '#fff';
      } else {
        // Gray for neither
        backgroundColor = COLORS.bg.darker;
        color = COLORS.text.secondary;
      }

      tiles.push(
        <div
          key={i}
          style={{
            backgroundColor,
            color,
            padding: '8px',
            borderRadius: BORDER_RADIUS.sm,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 'bold',
            fontSize: '14px',
            border: `1px solid ${COLORS.border.default}`
          }}
        >
          {i}
        </div>
      );
    }

    return (
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(8, 1fr)',
        gap: '4px',
        marginBottom: SPACING.md
      }}>
        {tiles}
      </div>
    );
  };

  // Render generator info if available
  const renderGeneratorInfo = () => {
    if (!bet.generator) return null;

    const gen = bet.generator;
    const methodIcons = {
      frequency: <Flame size={14} color={COLORS.accent.warning} />,
      cold: <Snowflake size={14} color={COLORS.accent.info} />,
      mixed: <Shuffle size={14} color={COLORS.text.secondary} />,
      average: <BarChart3 size={14} color={COLORS.accent.success} />,
      momentum: <Rocket size={14} color={COLORS.accent.error} />,
      shapes: <Shapes size={14} color={COLORS.accent.info} />
    };
    
    const methodNames = {
      frequency: 'Frequency (Hot)',
      cold: 'Cold',
      mixed: 'Mixed',
      average: 'Average',
      momentum: 'Momentum',
      shapes: 'Shapes'
    };

    return (
      <div style={{
        marginTop: SPACING.lg,
        padding: SPACING.md,
        background: COLORS.bg.darker,
        borderRadius: BORDER_RADIUS.md,
        border: `1px solid ${COLORS.border.default}`
      }}>
        <h3 style={{
          color: COLORS.text.primary,
          fontSize: '1.1em',
          marginBottom: SPACING.sm,
          display: 'flex',
          alignItems: 'center',
          gap: SPACING.xs
        }}>
          <Dices size={18} color={COLORS.accent.info} />
          Number Generator Used
        </h3>
        <div style={{ display: 'grid', gap: SPACING.xs, fontSize: '13px' }}>
          <DetailRow 
            label="Method" 
            value={
              <div style={{ display: 'flex', alignItems: 'center', gap: SPACING.xs }}>
                {methodIcons[gen.method]}
                {methodNames[gen.method] || gen.method}
              </div>
            } 
          />
          <DetailRow label="Count" value={gen.count} />
          <DetailRow label="Refresh" value={gen.interval === 0 ? 'Manual' : `${gen.interval} rounds`} />
          <DetailRow label="Auto-select" value={gen.autoSelect ? 'Yes' : 'No'} />
          {gen.sampleSize && <DetailRow label="Sample Size" value={gen.sampleSize} />}
          {gen.method === 'shapes' && (
            <>
              <DetailRow label="Pattern" value={gen.shapesPattern} />
              <DetailRow label="Placement" value={gen.shapesPlacement} />
            </>
          )}
          {gen.method === 'momentum' && (
            <>
              <DetailRow label="Detection Window" value={gen.momentumDetectionWindow} />
              <DetailRow label="Baseline Games" value={gen.momentumBaselineGames} />
              <DetailRow label="Threshold" value={gen.momentumThreshold} />
              <DetailRow label="Pool Size" value={gen.momentumPoolSize} />
            </>
          )}
        </div>
      </div>
    );
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0,0,0,0.7)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: SPACING.md
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: COLORS.bg.dark,
          padding: SPACING.lg,
          borderRadius: BORDER_RADIUS.lg,
          maxWidth: '700px',
          width: '100%',
          maxHeight: '90vh',
          overflow: 'auto',
          boxShadow: '0 4px 20px rgba(0,0,0,0.5)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: SPACING.lg,
          paddingBottom: SPACING.md,
          borderBottom: `2px solid ${COLORS.border.default}`
        }}>
          <h2 style={{
            margin: 0,
            color: COLORS.text.primary,
            fontSize: '1.5em',
            display: 'flex',
            alignItems: 'center',
            gap: SPACING.sm
          }}>
            <BarChart3 size={24} color={COLORS.accent.info} />
            Bet Details
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: COLORS.text.secondary,
              cursor: 'pointer',
              padding: '4px',
              display: 'flex',
              alignItems: 'center'
            }}
          >
            <X size={24} />
          </button>
        </div>

        {/* Bet Information Section */}
        <div style={{ marginBottom: SPACING.lg }}>
          <h3 style={{
            color: COLORS.text.primary,
            fontSize: '1.1em',
            marginBottom: SPACING.sm,
            display: 'flex',
            alignItems: 'center',
            gap: SPACING.xs
          }}>
            <BarChart3 size={18} color={COLORS.accent.info} />
            Bet Information
          </h3>
          <DetailRow label="Date" value={formatDate(bet.time)} />
          {bet.id && <DetailRow label="Bet ID" value={bet.id} />}
          <DetailRow label="Currency" value={kenoBet.currency || 'BTC'} />
          <DetailRow label="Difficulty" value={kenoBet.risk || 'Classic'} />
          <DetailRow label="Amount" value={`${parseFloat(kenoBet.amount || 0).toFixed(8)} ${kenoBet.currency || 'BTC'}`} />
          <DetailRow 
            label="Payout" 
            value={`${parseFloat(kenoBet.payout || 0).toFixed(8)} ${kenoBet.currency || 'BTC'}`}
            color={isProfitable ? COLORS.accent.success : COLORS.accent.error}
          />
          <DetailRow 
            label="Profit/Loss" 
            value={`${profitLoss >= 0 ? '+' : ''}${profitLoss.toFixed(8)} ${kenoBet.currency || 'BTC'}`}
            color={isProfitable ? COLORS.accent.success : COLORS.accent.error}
          />
          {kenoBet.payoutMultiplier && (
            <DetailRow label="Multiplier" value={`${kenoBet.payoutMultiplier}x`} />
          )}
          <DetailRow 
            label="Hits / Misses" 
            value={`${hits.length} / ${misses.length}`}
            color={COLORS.text.primary}
          />
        </div>

        {/* Number Board Section */}
        <div style={{ marginBottom: SPACING.lg }}>
          <h3 style={{
            color: COLORS.text.primary,
            fontSize: '1.1em',
            marginBottom: SPACING.sm,
            display: 'flex',
            alignItems: 'center',
            gap: SPACING.xs
          }}>
            <Target size={18} color={COLORS.accent.info} />
            Number Board
          </h3>
          {renderBoard()}
          
          {/* Legend */}
          <div style={{
            fontSize: '12px',
            color: COLORS.text.secondary,
            display: 'grid',
            gap: '4px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: SPACING.xs }}>
              <Circle size={12} fill={COLORS.accent.success} color={COLORS.accent.success} />
              <span style={{ color: COLORS.accent.success, fontWeight: 'bold' }}>Green</span> = Hit (Selected & Drawn)
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: SPACING.xs }}>
              <Circle size={12} fill="#7b2cbf" color="#7b2cbf" />
              <span style={{ color: '#7b2cbf', fontWeight: 'bold' }}>Purple</span> = Selected (Not Drawn)
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: SPACING.xs }}>
              <Circle size={12} fill={COLORS.accent.error} color={COLORS.accent.error} />
              <span style={{ color: COLORS.accent.error, fontWeight: 'bold' }}>Red</span> = Drawn (Not Selected)
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: SPACING.xs }}>
              <Circle size={12} fill={COLORS.text.tertiary} color={COLORS.text.tertiary} />
              <span style={{ color: COLORS.text.secondary }}>Gray</span> = Not selected or drawn
            </div>
          </div>
        </div>

        {/* Generator Info */}
        {renderGeneratorInfo()}
      </div>
    </div>
  );
}
