// src/ui/components/sections/ProfitLossSection.jsx
// Profit/Loss tracking section

import { useState, useEffect } from 'preact/hooks';
import { CollapsibleSection } from '../shared/CollapsibleSection.jsx';
import { COLORS } from '../../constants/colors.js';
import { BORDER_RADIUS, SPACING } from '../../constants/styles.js';

/**
 * ProfitLossSection Component
 * 
 * Displays session and total profit/loss with currency selector
 * 
 * Features:
 * - Session profit display
 * - Total profit display
 * - Currency selector (BTC, USD, etc.)
 * - Reset session button
 * 
 * @component
 * @returns {preact.VNode} The rendered profit/loss section
 */
export function ProfitLossSection() {
  const [sessionProfit, setSessionProfit] = useState(0);
  const [totalProfit, setTotalProfit] = useState(0);
  const [currency, setCurrency] = useState('BTC');

  // Update profit values from state
  useEffect(() => {
    const updateProfits = () => {
      // Read from state or window hooks
      if (window.__keno_getSessionProfit) {
        setSessionProfit(window.__keno_getSessionProfit());
      }
      if (window.__keno_getTotalProfit) {
        setTotalProfit(window.__keno_getTotalProfit());
      }
    };

    updateProfits();

    // Poll for updates (TODO: Replace with event-driven)
    const interval = setInterval(updateProfits, 1000);

    return () => clearInterval(interval);
  }, []);

  const handleCurrencyChange = (e) => {
    const newCurrency = e.target.value;
    setCurrency(newCurrency);
    
    // Trigger currency change via window hook
    if (window.__keno_changeCurrency) {
      window.__keno_changeCurrency(newCurrency);
    }
  };

  const handleResetSession = () => {
    if (window.__keno_resetSessionProfit) {
      window.__keno_resetSessionProfit();
      setSessionProfit(0);
    }
  };

  const formatProfit = (value) => {
    const isPositive = value >= 0;
    const color = isPositive ? '#4ade80' : '#f87171';
    const sign = isPositive ? '+' : '';
    
    return (
      <span style={{ color, fontWeight: 'bold', fontSize: '11px' }}>
        {sign}{value.toFixed(8)} {currency}
      </span>
    );
  };

  return (
    <CollapsibleSection
      icon="💰"
      title="Profit/Loss"
      defaultExpanded={false}
      headerExtra={
        <select
          value={currency}
          onChange={handleCurrencyChange}
          onClick={(e) => e.stopPropagation()} // Prevent collapse toggle
          style={{
            background: COLORS.bg.darkest,
            border: `1px solid ${COLORS.border.default}`,
            color: COLORS.text.primary,
            padding: '2px 4px',
            borderRadius: BORDER_RADIUS.sm,
            fontSize: '10px',
            cursor: 'pointer'
          }}
        >
          <option value="BTC">BTC</option>
          <option value="USD">USD</option>
          <option value="ETH">ETH</option>
        </select>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {/* Session Profit */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center' 
        }}>
          <span style={{ color: COLORS.text.secondary, fontSize: '11px' }}>Session:</span>
          {formatProfit(sessionProfit)}
        </div>

        {/* Total Profit */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center' 
        }}>
          <span style={{ color: COLORS.text.secondary, fontSize: '11px' }}>Total:</span>
          {formatProfit(totalProfit)}
        </div>

        {/* Reset Session Button */}
        <button
          onClick={handleResetSession}
          style={{
            width: '100%',
            background: COLORS.bg.darker,
            color: COLORS.accent.info,
            border: 'none',
            padding: SPACING.inputPadding,
            borderRadius: BORDER_RADIUS.sm,
            fontSize: '10px',
            cursor: 'pointer',
            marginTop: '2px',
            fontWeight: '500',
            transition: 'background 0.2s'
          }}
          onMouseEnter={(e) => e.target.style.background = '#344e64'}
          onMouseLeave={(e) => e.target.style.background = '#2a3b4a'}
        >
          Reset Session
        </button>
      </div>
    </CollapsibleSection>
  );
}
