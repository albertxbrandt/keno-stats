// src/ui/components/sections/HistorySection.jsx
// History section - displays last 100 game results

import { useState, useEffect } from 'preact/hooks';
import { state } from '../../../core/state.js';
import { clearHistory } from '../../../storage/history.js';
import { highlightRound } from '../../../utils/dom/heatmap.js';
import { stateEvents, EVENTS } from '../../../core/stateEvents.js';
import { CollapsibleSection } from '../shared/CollapsibleSection.jsx';
import { COLORS } from '../../constants/colors.js';
import { BORDER_RADIUS, SPACING } from '../../constants/styles.js';

const storageApi = (typeof browser !== 'undefined') ? browser : chrome;

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

  // Update history from events
  useEffect(() => {
    // Initial load
    setHistory([...(state.currentHistory || [])]);

    // Listen for history updates
    const unsubscribe = stateEvents.on(EVENTS.HISTORY_UPDATED, (newHistory) => {
      setHistory([...newHistory]);
    });

    return unsubscribe;
  }, []);

  const handleClear = (e) => {
    e.stopPropagation();
    if (confirm('Clear all history?')) {
      clearHistory();
      setHistory([]);
    }
  };

  const handleOpenBetBook = () => {
    const url = storageApi.runtime.getURL('betbook.html');
    window.open(url, '_blank', 'width=1200,height=800');
  };

  const formatRoundNumber = (index) => {
    return `#${history.length - index}`;
  };

  return (
    <CollapsibleSection
      icon="📋"
      title={`History (${history.length} rounds)`}
      defaultExpanded={false}
      headerExtra={
        <button
          onClick={handleClear}
          style={{
            background: 'none',
            border: 'none',
            color: COLORS.accent.error,
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
            border: `1px solid ${COLORS.border.default}`,
            background: COLORS.bg.darkest,
            padding: '5px',
            borderRadius: BORDER_RADIUS.sm
          }}
        >
          {history.length === 0 ? (
            <div style={{
              color: COLORS.text.tertiary,
              fontSize: '10px',
              padding: SPACING.sm,
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
                  background: COLORS.bg.dark,
                  borderRadius: BORDER_RADIUS.sm,
                  fontSize: '10px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  cursor: 'pointer',
                  transition: 'background 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = COLORS.bg.darker}
                onMouseLeave={(e) => e.currentTarget.style.background = COLORS.bg.dark}
                onClick={() => highlightRound(round)}
              >
                <span style={{ color: COLORS.accent.info, fontWeight: 'bold', minWidth: '35px' }}>
                  {formatRoundNumber(index)}
                </span>
                <span style={{ flex: 1, display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <span style={{ color: COLORS.accent.success }}>
                    ✓ {round.hits?.length || 0}
                  </span>
                  <span style={{ color: COLORS.accent.error }}>
                    ✗ {round.misses?.length || 0}
                  </span>
                </span>
                {round.time && (
                  <span style={{ color: COLORS.text.tertiary, fontSize: '8px' }}>
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
