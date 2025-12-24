// src/dashboard/sections/Statistics.jsx
// Statistics section - placeholder for future implementation

import { useState, useEffect } from 'preact/hooks';
import { loadBetHistory } from '../utils/storage.js';
import { COLORS } from '@/shared/constants/colors.js';
import { BORDER_RADIUS, SPACING } from '@/shared/constants/styles.js';

/**
 * Statistics Section
 * Overview of key metrics and statistics
 */
export function Statistics() {
  const [stats, setStats] = useState({
    totalBets: 0,
    totalWagered: 0,
    totalPayout: 0,
    totalProfit: 0,
    winRate: 0,
    avgHits: 0
  });

  useEffect(() => {
    loadBetHistory().then(data => {
      // Calculate basic stats
      const totalBets = data.length;
      const totalWagered = data.reduce((sum, bet) => 
        sum + (parseFloat(bet.kenoBet?.amount) || 0), 0);
      const totalPayout = data.reduce((sum, bet) => 
        sum + (parseFloat(bet.kenoBet?.payout) || 0), 0);
      const totalProfit = totalPayout - totalWagered;
      const wins = data.filter(bet => 
        (parseFloat(bet.kenoBet?.payout) || 0) > (parseFloat(bet.kenoBet?.amount) || 0)
      ).length;
      const winRate = totalBets > 0 ? (wins / totalBets) * 100 : 0;
      
      const totalHits = data.reduce((sum, bet) => {
        const hits = bet.kenoBet?.state?.selectedNumbers?.filter(n => 
          bet.kenoBet?.state?.drawnNumbers?.includes(n)
        ).length || 0;
        return sum + hits;
      }, 0);
      const avgHits = totalBets > 0 ? totalHits / totalBets : 0;

      setStats({
        totalBets,
        totalWagered,
        totalPayout,
        totalProfit,
        winRate,
        avgHits
      });
    });
  }, []);

  const StatCard = ({ label, value, color }) => (
    <div style={{
      background: COLORS.bg.darker,
      padding: SPACING.lg,
      borderRadius: BORDER_RADIUS.md,
      border: `1px solid ${COLORS.border.default}`
    }}>
      <div style={{
        color: COLORS.text.secondary,
        fontSize: '12px',
        marginBottom: SPACING.xs
      }}>
        {label}
      </div>
      <div style={{
        color: color || COLORS.text.primary,
        fontSize: '24px',
        fontWeight: 'bold'
      }}>
        {value}
      </div>
    </div>
  );

  return (
    <div>
      <h2 style={{
        margin: `0 0 ${SPACING.lg} 0`,
        color: COLORS.text.primary,
        fontSize: '1.3em'
      }}>
        Overview Statistics
      </h2>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: SPACING.md,
        marginBottom: SPACING.xl
      }}>
        <StatCard label="Total Bets" value={stats.totalBets} />
        <StatCard label="Total Wagered" value={stats.totalWagered.toFixed(8)} />
        <StatCard label="Total Payout" value={stats.totalPayout.toFixed(8)} />
        <StatCard 
          label="Total Profit/Loss" 
          value={(stats.totalProfit >= 0 ? '+' : '') + stats.totalProfit.toFixed(8)}
          color={stats.totalProfit >= 0 ? COLORS.accent.success : COLORS.accent.error}
        />
        <StatCard label="Win Rate" value={`${stats.winRate.toFixed(1)}%`} />
        <StatCard label="Avg Hits" value={stats.avgHits.toFixed(2)} />
      </div>

      <div style={{
        background: COLORS.bg.darker,
        padding: SPACING.xl,
        borderRadius: BORDER_RADIUS.md,
        border: `1px solid ${COLORS.border.default}`,
        textAlign: 'center',
        color: COLORS.text.secondary
      }}>
        <h3 style={{ color: COLORS.text.primary, marginBottom: SPACING.md }}>
          Coming Soon
        </h3>
        <p>More detailed statistics and charts will be added here:</p>
        <ul style={{ 
          listStyle: 'none', 
          padding: 0,
          textAlign: 'left',
          maxWidth: '400px',
          margin: '0 auto'
        }}>
          <li>• Profit/Loss trends over time</li>
          <li>• Hit distribution charts</li>
          <li>• Currency breakdown</li>
          <li>• Risk level performance</li>
          <li>• Time-based analysis</li>
        </ul>
      </div>
    </div>
  );
}
