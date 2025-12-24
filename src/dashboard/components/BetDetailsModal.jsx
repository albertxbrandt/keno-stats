// src/dashboard/components/BetDetailsModal.jsx
import { getHits, getMisses } from '@/shared/storage/history.js';
import { COLORS } from '@/shared/constants/colors.js';
import { BORDER_RADIUS, SPACING } from '@/shared/constants/styles.js';

/**
 * BetDetailsModal Component
 * Modal showing detailed information about a specific bet
 */
export function BetDetailsModal({ bet, onClose }) {
  if (!bet) return null;

  const kenoBet = bet.kenoBet || {};
  const hits = getHits(bet);
  const misses = getMisses(bet);
  const selected = kenoBet.state?.selectedNumbers || [];
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
        overflow: 'auto'
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: COLORS.background.secondary,
          padding: SPACING.xl,
          borderRadius: BORDER_RADIUS.lg,
          maxWidth: '600px',
          width: '90%',
          maxHeight: '90vh',
          overflow: 'auto',
          boxShadow: '0 4px 20px rgba(0,0,0,0.5)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 style={{
          margin: `0 0 ${SPACING.lg} 0`,
          color: COLORS.text.primary,
          fontSize: '1.3em'
        }}>
          Bet Details
        </h2>

        {/* Basic Info */}
        <div style={{ marginBottom: SPACING.lg }}>
          <DetailRow label="Date" value={formatDate(bet.time)} />
          <DetailRow label="Currency" value={kenoBet.currency || 'BTC'} />
          <DetailRow label="Risk" value={kenoBet.risk || 'Classic'} />
          <DetailRow label="Amount" value={parseFloat(kenoBet.amount).toFixed(8)} />
          <DetailRow 
            label="Payout" 
            value={parseFloat(kenoBet.payout).toFixed(8)}
            color={isProfitable ? COLORS.accent.success : COLORS.accent.danger}
          />
          <DetailRow 
            label="Profit/Loss" 
            value={(profitLoss >= 0 ? '+' : '') + profitLoss.toFixed(8)}
            color={isProfitable ? COLORS.accent.success : COLORS.accent.danger}
          />
          {kenoBet.payoutMultiplier && (
            <DetailRow label="Multiplier" value={`${kenoBet.payoutMultiplier}x`} />
          )}
        </div>

        {/* Numbers */}
        <div style={{ marginBottom: SPACING.lg }}>
          <h3 style={{ color: COLORS.text.primary, fontSize: '1.1em', marginBottom: SPACING.sm }}>
            Numbers
          </h3>
          
          <div style={{ marginBottom: SPACING.md }}>
            <div style={{ color: COLORS.text.secondary, marginBottom: SPACING.xs }}>
              Selected ({selected.length}):
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: SPACING.xs }}>
              {selected.map(num => (
                <span
                  key={num}
                  style={{
                    padding: '4px 8px',
                    background: hits.includes(num) ? COLORS.accent.success : COLORS.bg.darker,
                    color: COLORS.text.primary,
                    borderRadius: BORDER_RADIUS.sm,
                    fontSize: '12px',
                    fontWeight: 'bold'
                  }}
                >
                  {num}
                </span>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: SPACING.md }}>
            <div style={{ color: COLORS.text.secondary, marginBottom: SPACING.xs }}>
              Hits ({hits.length}):
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: SPACING.xs }}>
              {hits.map(num => (
                <span
                  key={num}
                  style={{
                    padding: '4px 8px',
                    background: COLORS.accent.success,
                    color: '#fff',
                    borderRadius: BORDER_RADIUS.sm,
                    fontSize: '12px',
                    fontWeight: 'bold'
                  }}
                >
                  {num}
                </span>
              ))}
            </div>
          </div>

          <div>
            <div style={{ color: COLORS.text.secondary, marginBottom: SPACING.xs }}>
              Misses ({misses.length}):
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: SPACING.xs }}>
              {misses.map(num => (
                <span
                  key={num}
                  style={{
                    padding: '4px 8px',
                    background: COLORS.accent.danger,
                    color: '#fff',
                    borderRadius: BORDER_RADIUS.sm,
                    fontSize: '12px',
                    fontWeight: 'bold'
                  }}
                >
                  {num}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Generator Info (if available) */}
        {bet.generator && (
          <div style={{ marginBottom: SPACING.lg }}>
            <h3 style={{ color: COLORS.text.primary, fontSize: '1.1em', marginBottom: SPACING.sm }}>
              Generator Settings
            </h3>
            <DetailRow label="Method" value={bet.generator.method} />
            <DetailRow label="Count" value={bet.generator.count} />
            <DetailRow label="Sample Size" value={bet.generator.sampleSize} />
          </div>
        )}

        <button
          onClick={onClose}
          style={{
            width: '100%',
            padding: SPACING.md,
            background: COLORS.bg.darker,
            color: COLORS.text.primary,
            border: 'none',
            borderRadius: BORDER_RADIUS.md,
            cursor: 'pointer',
            fontSize: '14px'
          }}
        >
          Close
        </button>
      </div>
    </div>
  );
}
