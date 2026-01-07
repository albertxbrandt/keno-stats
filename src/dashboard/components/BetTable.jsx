// src/dashboard/components/BetTable.jsx
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-preact';
import { getHits, getMisses } from '@/shared/storage/history.js';
import { COLORS } from '@/shared/constants/colors.js';
import { SPACING } from '@/shared/constants/styles.js';

/**
 * BetTable Component
 * Sortable table displaying bet history
 */
export function BetTable({ bets, columnVisibility, sortField, sortDirection, onSort, onRowClick }) {
  const getSortIcon = (field) => {
    if (sortField !== field) return <ArrowUpDown size={14} color={COLORS.text.tertiary} />;
    return sortDirection === 'asc' 
      ? <ArrowUp size={14} color={COLORS.accent.info} /> 
      : <ArrowDown size={14} color={COLORS.accent.info} />;
  };

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  const formatNumber = (num, decimals = 8) => {
    return parseFloat(num).toFixed(decimals);
  };

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{
        width: '100%',
        borderCollapse: 'collapse',
        fontSize: '13px'
      }}>
        <thead>
          <tr>
            {columnVisibility.date && (
              <th onClick={() => onSort('date')} style={headerStyle}>
                <span style={{ display: 'flex', alignItems: 'center', gap: SPACING.xs }}>
                  Date {getSortIcon('date')}
                </span>
              </th>
            )}
            {columnVisibility.amount && (
              <th onClick={() => onSort('amount')} style={headerStyle}>
                <span style={{ display: 'flex', alignItems: 'center', gap: SPACING.xs }}>
                  Amount {getSortIcon('amount')}
                </span>
              </th>
            )}
            {columnVisibility.payout && (
              <th onClick={() => onSort('payout')} style={headerStyle}>
                <span style={{ display: 'flex', alignItems: 'center', gap: SPACING.xs }}>
                  Payout {getSortIcon('payout')}
                </span>
              </th>
            )}
            {columnVisibility.multiplier && (
              <th onClick={() => onSort('multiplier')} style={headerStyle}>
                <span style={{ display: 'flex', alignItems: 'center', gap: SPACING.xs }}>
                  Multiplier {getSortIcon('multiplier')}
                </span>
              </th>
            )}
            {columnVisibility.currency && (
              <th onClick={() => onSort('currency')} style={headerStyle}>
                <span style={{ display: 'flex', alignItems: 'center', gap: SPACING.xs }}>
                  Currency {getSortIcon('currency')}
                </span>
              </th>
            )}
            {columnVisibility.risk && (
              <th onClick={() => onSort('risk')} style={headerStyle}>
                <span style={{ display: 'flex', alignItems: 'center', gap: SPACING.xs }}>
                  Risk {getSortIcon('risk')}
                </span>
              </th>
            )}
            {columnVisibility.hits && (
              <th onClick={() => onSort('hits')} style={headerStyle}>
                <span style={{ display: 'flex', alignItems: 'center', gap: SPACING.xs }}>
                  Hits {getSortIcon('hits')}
                </span>
              </th>
            )}
            {columnVisibility.misses && (
              <th onClick={() => onSort('misses')} style={headerStyle}>
                <span style={{ display: 'flex', alignItems: 'center', gap: SPACING.xs }}>
                  Misses {getSortIcon('misses')}
                </span>
              </th>
            )}
          </tr>
        </thead>
        <tbody>
          {bets.length === 0 ? (
            <tr>
              <td colSpan="8" style={{
                textAlign: 'center',
                padding: SPACING.xl,
                color: COLORS.text.secondary
              }}>
                No bets found
              </td>
            </tr>
          ) : (
            bets.map((bet, index) => {
              const kenoBet = bet.kenoBet || {};
              const hits = getHits(bet);
              const misses = getMisses(bet);
              const profitLoss = (parseFloat(kenoBet.payout) || 0) - (parseFloat(kenoBet.amount) || 0);
              const isProfitable = profitLoss >= 0;

              return (
                <tr
                  key={index}
                  onClick={() => onRowClick(bet)}
                  style={{
                    cursor: 'pointer',
                    borderBottom: `1px solid ${COLORS.border.default}`,
                    transition: 'background 0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = COLORS.bg.darker}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  {columnVisibility.date && (
                    <td style={cellStyle}>{formatDate(bet.time)}</td>
                  )}
                  {columnVisibility.amount && (
                    <td style={cellStyle}>{formatNumber(kenoBet.amount)}</td>
                  )}
                  {columnVisibility.payout && (
                    <td style={{
                      ...cellStyle,
                      color: isProfitable ? COLORS.accent.success : COLORS.accent.danger,
                      fontWeight: 'bold'
                    }}>
                      {formatNumber(kenoBet.payout)}
                    </td>
                  )}
                  {columnVisibility.multiplier && (
                    <td style={cellStyle}>
                      {kenoBet.payoutMultiplier ? `${kenoBet.payoutMultiplier}x` : '-'}
                    </td>
                  )}
                  {columnVisibility.currency && (
                    <td style={cellStyle}>{kenoBet.currency || 'BTC'}</td>
                  )}
                  {columnVisibility.risk && (
                    <td style={cellStyle}>{kenoBet.risk || 'Classic'}</td>
                  )}
                  {columnVisibility.hits && (
                    <td style={{ ...cellStyle, color: COLORS.accent.success, fontWeight: 'bold' }}>
                      {hits.length}
                    </td>
                  )}
                  {columnVisibility.misses && (
                    <td style={{ ...cellStyle, color: COLORS.accent.danger, fontWeight: 'bold' }}>
                      {misses.length}
                    </td>
                  )}
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}

const headerStyle = {
  background: COLORS.bg.darker,
  color: COLORS.text.primary,
  padding: SPACING.md,
  textAlign: 'left',
  cursor: 'pointer',
  userSelect: 'none',
  fontWeight: 'bold',
  position: 'sticky',
  top: 0
};

const cellStyle = {
  padding: SPACING.md,
  color: COLORS.text.primary
};
