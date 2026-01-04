// src/ui/components/sections/ProfitLossSection.jsx
// Profit/Loss tracking section

import { useState, useEffect } from 'preact/hooks';
import { CollapsibleSection } from '@/shared/components/CollapsibleSection.jsx';
import { Button } from '@/shared/components/Button.jsx';
import { DollarSign } from 'lucide-preact';
import { getSessionProfit, getTotalProfit, changeCurrency, resetSessionProfit } from '@/shared/storage/profitLoss.js';
import { state } from '@/games/keno/core/state.js';
import { stateEvents, EVENTS } from '@/games/keno/core/stateEvents.js';
import { COLORS } from '@/shared/constants/colors.js';
import { BORDER_RADIUS } from '@/shared/constants/styles.js';

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
  const [currency, setCurrency] = useState(null);
  const [availableCurrencies, setAvailableCurrencies] = useState([]);

  // Update profit values from events
  useEffect(() => {
    // Function to update all values from state
    const updateFromState = () => {
      setSessionProfit(getSessionProfit());
      setTotalProfit(getTotalProfit());
      
      // Get available currencies from profitByCurrency
      const currencies = Object.keys(state.profitByCurrency || {}).map(c => c.toUpperCase());
      setAvailableCurrencies(currencies);
      
      // Set currency: use state currency or first available currency
      if (state.selectedCurrency) {
        setCurrency(state.selectedCurrency.toUpperCase());
      } else if (currencies.length > 0) {
        setCurrency(currencies[0]);
      }
    };

    // Initial load - check if data already exists
    updateFromState();

    // Listen for profit updates - event includes currency from bet data
    const unsubscribe = stateEvents.on(EVENTS.PROFIT_UPDATED, (eventData) => {
      setSessionProfit(getSessionProfit());
      setTotalProfit(getTotalProfit());
      
      // Get available currencies from profitByCurrency
      const currencies = Object.keys(state.profitByCurrency || {}).map(c => c.toUpperCase());
      setAvailableCurrencies(currencies);
      
      // Set currency: use event currency, or state currency, or first available currency
      if (eventData?.currency) {
        setCurrency(eventData.currency.toUpperCase());
      } else if (state.selectedCurrency) {
        setCurrency(state.selectedCurrency.toUpperCase());
      } else if (currencies.length > 0) {
        setCurrency(currencies[0]);
      }
    });

    return unsubscribe;
  }, []);

  const handleCurrencyChange = (e) => {
    const newCurrency = e.target.value;
    setCurrency(newCurrency);
    changeCurrency(newCurrency);
  };

  const handleResetSession = () => {
    resetSessionProfit();
    setSessionProfit(0);
  };

  const formatProfit = (value) => {
    if (!currency) {
      return (
        <span style={{ color: COLORS.text.secondary, fontSize: '11px' }}>
          No data
        </span>
      );
    }
    
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
      icon={<DollarSign size={14} strokeWidth={2} />}
      title="Profit/Loss"
      defaultExpanded={false}
      headerActions={
        <select
          value={currency || ''}
          onChange={handleCurrencyChange}
          onClick={(e) => e.stopPropagation()} // Prevent collapse toggle
          disabled={availableCurrencies.length === 0}
          style={{
            background: COLORS.bg.darkest,
            border: `1px solid ${COLORS.border.default}`,
            color: COLORS.text.primary,
            padding: '2px 4px',
            borderRadius: BORDER_RADIUS.sm,
            fontSize: '10px',
            cursor: availableCurrencies.length === 0 ? 'not-allowed' : 'pointer',
            opacity: availableCurrencies.length === 0 ? 0.5 : 1
          }}
        >
          {availableCurrencies.length === 0 ? (
            <option value="">No data</option>
          ) : (
            availableCurrencies.map(curr => (
              <option key={curr} value={curr}>{curr}</option>
            ))
          )}
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
        <Button
          variant="ghost"
          size="sm"
          fullWidth
          onClick={handleResetSession}
          style={{ marginTop: '2px' }}
        >
          Reset Session
        </Button>
      </div>
    </CollapsibleSection>
  );
}
