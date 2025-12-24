// src/betbook/components/BetTable.jsx
import { getHits, getMisses } from '../../storage/history.js';
import { COLORS } from '../../ui/constants/colors.js';
import { SPACING } from '../../ui/constants/styles.js';

/**
 * BetTable Component
 * Sortable table displaying bet history
 */
export function BetTable({ bets, columnVisibility, sortField, sortDirection, onSort, onRowClick }) {
  const getSortIcon = (field) => {
    if (sortField !== field) return '↕️';
    return sortDirection === 'asc' ? '↑' : '↓';
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
                Date {getSortIcon('date')}
              </th>
            )}
            {columnVisibility.amount && (
              <th onClick={() => onSort('amount')} style={headerStyle}>
                Amount {getSortIcon('amount')}
              </th>
            )}
            {columnVisibility.payout && (
              <th onClick={() => onSort('payout')} style={headerStyle}>
                Payout {getSortIcon('payout')}
              </th>
            )}
            {columnVisibility.multiplier && (
              <th onClick={() => onSort('multiplier')} style={headerStyle}>
                Multiplier {getSortIcon('multiplier')}
              </th>
            )}
            {columnVisibility.currency && (
              <th onClick={() => onSort('currency')} style={headerStyle}>
                Currency {getSortIcon('currency')}
              </th>
            )}
            {columnVisibility.risk && (
              <th onClick={() => onSort('risk')} style={headerStyle}>
                Risk {getSortIcon('risk')}
              </th>
            )}
            {columnVisibility.hits && (
              <th onClick={() => onSort('hits')} style={headerStyle}>
                Hits {getSortIcon('hits')}
              </th>
            )}
            {columnVisibility.misses && (
              <th onClick={() => onSort('misses')} style={headerStyle}>
                Misses {getSortIcon('misses')}
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
