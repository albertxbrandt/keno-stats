// src/ui/components/sections/HistorySection.jsx
// History section - displays last 100 game results

import { useState, useEffect } from 'preact/hooks';
import { state } from '../../../core/state.js';
// eslint-disable-next-line no-unused-vars
import { CollapsibleSection } from '../shared/CollapsibleSection.jsx';

/**
 * HistorySection Component
 * 
 * Displays game history with hits/misses for each round
 * 
 * Features:
 * - Scrollable history list
 * - Clear history button in header
 * - Open bet book button
 * 
 * @component
 * @returns {preact.VNode} The rendered history section
 */
export function HistorySection() {
  const [history, setHistory] = useState([]);

  // Update history from state
  useEffect(() => {
    const updateHistory = () => {
      setHistory([...state.currentHistory] || []);
    };

    updateHistory();

    // Poll for updates (TODO: Replace with event-driven)
    const interval = setInterval(updateHistory, 1000);

    return () => clearInterval(interval);
  }, []);

  const handleClear = (e) => {
    e.stopPropagation();
    if (window.__keno_clearHistory && confirm('Clear all history?')) {
      window.__keno_clearHistory();
      setHistory([]);
    }
  };

  const handleOpenBetBook = () => {
    if (window.__keno_openBetBook) {
      window.__keno_openBetBook();
    }
  };

  const formatRoundNumber = (index) => {
    return `#${history.length - index}`;
  };

  return (
    <CollapsibleSection
      icon="📋"
      title={`History (Last ${history.length})`}
      defaultExpanded={false}
      headerExtra={
        <button
          onClick={handleClear}
          style={{
            background: 'none',
            border: 'none',
            color: '#f55',
            cursor: 'pointer',
            fontSize: '11px',
            fontWeight: 'bold',
            padding: '0',
            transition: 'opacity 0.2s'
          }}
          onMouseEnter={(e) => e.target.style.opacity = '0.7'}
          onMouseLeave={(e) => e.target.style.opacity = '1'}
        >
          Reset
        </button>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {/* History List */}
        <div
          id="history-list"
          style={{
            height: '150px',
            overflowY: 'auto',
            border: '1px solid #333',
            background: '#14202b',
            padding: '5px',
            borderRadius: '4px'
          }}
        >
          {history.length === 0 ? (
            <div style={{
              color: '#666',
              fontSize: '10px',
              padding: '8px',
              textAlign: 'center'
            }}>
              No history yet
            </div>
          ) : (
            // Only render last 100 rounds to prevent performance issues
            [...history].reverse().slice(0, 100).map((round, index) => (
              <div
                key={index}
                style={{
                  padding: '4px 6px',
                  marginBottom: '3px',
                  background: '#0f212e',
                  borderRadius: '3px',
                  fontSize: '10px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  cursor: 'pointer',
                  transition: 'background 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = '#1a2c38'}
                onMouseLeave={(e) => e.currentTarget.style.background = '#0f212e'}
                onClick={() => {
                  if (window.__keno_highlightRound) {
                    window.__keno_highlightRound(round);
                  }
                }}
              >
                <span style={{ color: '#74b9ff', fontWeight: 'bold', minWidth: '35px' }}>
                  {formatRoundNumber(index)}
                </span>
                <span style={{ flex: 1, display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <span style={{ color: '#4ade80' }}>
                    ✓ {round.hits?.length || 0}
                  </span>
                  <span style={{ color: '#f87171' }}>
                    ✗ {round.misses?.length || 0}
                  </span>
                </span>
                {round.time && (
                  <span style={{ color: '#666', fontSize: '8px' }}>
                    {new Date(round.time).toLocaleTimeString()}
                  </span>
                )}
              </div>
            ))
          )}
        </div>

        {/* Open Bet Book Button */}
        <button
          onClick={handleOpenBetBook}
          style={{
            width: '100%',
            background: '#ffd700',
            color: '#222',
            border: 'none',
            padding: '8px 10px',
            borderRadius: '4px',
            fontWeight: 'bold',
            cursor: 'pointer',
            fontSize: '11px',
            transition: 'opacity 0.2s'
          }}
          onMouseEnter={(e) => e.target.style.opacity = '0.9'}
          onMouseLeave={(e) => e.target.style.opacity = '1'}
        >
          📊 Open Stats Book
        </button>
      </div>
    </CollapsibleSection>
  );
}
