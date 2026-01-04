// src/ui/components/sections/HitsMissSection.jsx
// Display component showing hits and misses from the last round
// Uses badge/chip layout for easy scanning

import { useEffect, useState } from 'preact/hooks';
import { state } from '@/games/keno/core/state.js';
import { stateEvents, EVENTS } from '@/games/keno/core/stateEvents.js';
import { useModals } from '@/games/keno/hooks/useModals.js';
import { COLORS } from '@/shared/constants/colors.js';
import { BORDER_RADIUS, SPACING } from '@/shared/constants/styles.js';
import { CheckCircle2, XCircle, Radio, ChevronDown, ChevronUp } from 'lucide-preact';
import { Button } from '@/shared/components/Button.jsx';

/**
 * HitsMissSection Component
 * 
 * Displays the hits and misses from the most recent Keno round.
 * Hits are numbers you selected that were drawn (green badges).
 * Misses are numbers that were drawn but you didn't select (red badges).
 * 
 * Uses event-driven updates via stateEvents.ROUND_SAVED event.
 * 
 * @component
 * @returns {preact.VNode} The rendered component
 * 
 * @example
 * <HitsMissSection />
 */
export function HitsMissSection() {
  // State for hits and misses arrays
  const [hitsArray, setHitsArray] = useState([]);
  const [missesArray, setMissesArray] = useState([]);
  const [hitsCollapsed, setHitsCollapsed] = useState(false);
  const [missesCollapsed, setMissesCollapsed] = useState(true);
  const [roundId, setRoundId] = useState(Date.now());
  const { showLiveStats } = useModals();

  // Subscribe to round updates
  useEffect(() => {
    const updateFromEvent = (eventData) => {
      // Use arrays directly from event payload
      setHitsArray(eventData.hits || []);
      setMissesArray(eventData.misses || []);
      setRoundId(Date.now()); // Force re-render with new unique keys
    };

    // Initial update from state (if available)
    if (state.trackerHits && Array.isArray(state.trackerHits)) {
      setHitsArray(state.trackerHits);
    }
    if (state.trackerMisses && Array.isArray(state.trackerMisses)) {
      setMissesArray(state.trackerMisses);
    }

    // Subscribe to round saved event
    const unsubscribe = stateEvents.on(EVENTS.ROUND_SAVED, updateFromEvent);

    return () => unsubscribe();
  }, []);

  return (
    <div style={{
      marginBottom: SPACING.lg,
      background: COLORS.bg.dark,
      padding: SPACING.sm,
      borderRadius: BORDER_RADIUS.sm
    }}>
      {/* Hits Section */}
      <div style={{ marginBottom: SPACING.sm }}>
        <div 
          onClick={() => setHitsCollapsed(!hitsCollapsed)}
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '4px',
            marginBottom: hitsCollapsed ? '0' : '6px',
            cursor: 'pointer',
            transition: 'opacity 0.2s'
          }}
          onMouseEnter={(e) => e.currentTarget.style.opacity = '0.7'}
          onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
        >
          <CheckCircle2 size={11} color={COLORS.accent.success} strokeWidth={2.5} />
          <span style={{ 
            color: COLORS.accent.success, 
            fontSize: '10px',
            fontWeight: '600'
          }}>
            Hits {hitsArray.length > 0 ? `(${hitsArray.length})` : ''}
          </span>
          {hitsArray.length > 0 && (
            hitsCollapsed 
              ? <ChevronDown size={10} color={COLORS.accent.success} strokeWidth={2.5} />
              : <ChevronUp size={10} color={COLORS.accent.success} strokeWidth={2.5} />
          )}
        </div>
        {!hitsCollapsed && (
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '3px',
            minHeight: '26px',
            alignItems: 'flex-start',
            justifyContent: 'flex-start'
          }}>
            {hitsArray.length === 0 ? (
              <span style={{ 
                fontSize: '11px', 
                color: COLORS.text.tertiary,
                fontStyle: 'italic'
              }}>
                No hits this round
              </span>
            ) : (
              hitsArray.map(num => (
                <span
                  key={`hit-${roundId}-${num}`}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '26px',
                    height: '26px',
                    borderRadius: '4px',
                    fontSize: '12px',
                    fontWeight: '600',
                    lineHeight: '1',
                    background: 'rgba(39, 174, 96, 0.15)',
                    color: COLORS.accent.success,
                    border: `1px solid rgba(39, 174, 96, 0.3)`
                  }}
                >
                  {num}
                </span>
              ))
            )}
          </div>
        )}
      </div>

      {/* Misses Section */}
      <div style={{ marginBottom: SPACING.sm }}>
        <div 
          onClick={() => setMissesCollapsed(!missesCollapsed)}
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '4px',
            marginBottom: missesCollapsed ? '0' : '6px',
            cursor: 'pointer',
            transition: 'opacity 0.2s'
          }}
          onMouseEnter={(e) => e.currentTarget.style.opacity = '0.7'}
          onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
        >
          <XCircle size={11} color={COLORS.accent.error} strokeWidth={2.5} />
          <span style={{ 
            color: COLORS.accent.error, 
            fontSize: '10px',
            fontWeight: '600'
          }}>
            Misses {missesArray.length > 0 ? `(${missesArray.length})` : ''}
          </span>
          {missesArray.length > 0 && (
            missesCollapsed 
              ? <ChevronDown size={10} color={COLORS.accent.error} strokeWidth={2.5} />
              : <ChevronUp size={10} color={COLORS.accent.error} strokeWidth={2.5} />
          )}
        </div>
        {!missesCollapsed && (
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '3px',
            minHeight: '21px',
            alignItems: 'flex-start',
            justifyContent: 'flex-start'
          }}>
            {missesArray.length === 0 ? (
              <span style={{ 
                fontSize: '11px', 
                color: COLORS.text.tertiary,
                fontStyle: 'italic'
              }}>
                No misses this round
              </span>
            ) : (
              missesArray.map(num => (
                <span
                  key={`miss-${roundId}-${num}`}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '21px',
                    height: '21px',
                    borderRadius: '4px',
                    fontSize: '10px',
                    fontWeight: '600',
                    lineHeight: '1',
                    background: 'rgba(235, 77, 75, 0.15)',
                    color: COLORS.accent.error,
                    border: `1px solid rgba(235, 77, 75, 0.3)`
                  }}
                >
                  {num}
                </span>
              ))
            )}
          </div>
        )}
      </div>
      
      {/* Live Stats Button */}
      <Button
        variant="ghost"
        size="sm"
        fullWidth
        onClick={showLiveStats}
        icon={<Radio size={12} strokeWidth={2} />}
        iconPosition="left"
        style={{ marginTop: '4px' }}
      >
        Live Stats
      </Button>
    </div>
  );
}
