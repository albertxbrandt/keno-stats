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
  // Parse comma-separated strings into arrays
  const [hitsArray, setHitsArray] = useState([]);
  const [missesArray, setMissesArray] = useState([]);
  const [hitsCollapsed, setHitsCollapsed] = useState(false);
  const [missesCollapsed, setMissesCollapsed] = useState(false);
  const { showLiveStats } = useModals();

  // Subscribe to round updates
  useEffect(() => {
    const updateFromState = () => {
      const hitsStr = state.trackerHits || '';
      const missesStr = state.trackerMisses || '';
      
      // Parse comma-separated strings into number arrays
      const hits = hitsStr === '-' || hitsStr === '' 
        ? [] 
        : hitsStr.split(',').map(n => parseInt(n.trim())).filter(n => !isNaN(n));
      
      const misses = missesStr === '-' || missesStr === '' 
        ? [] 
        : missesStr.split(',').map(n => parseInt(n.trim())).filter(n => !isNaN(n));
      
      setHitsArray(hits);
      setMissesArray(misses);
    };

    // Initial update
    updateFromState();

    // Subscribe to round saved event
    const unsubscribe = stateEvents.on(EVENTS.ROUND_SAVED, updateFromState);

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
            gap: '7px',
            minHeight: '34px',
            alignItems: 'flex-start',
            justifyContent: 'flex-start'
          }}>
            {hitsArray.map(num => (
                <span
                  key={num}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '34px',
                    height: '34px',
                    borderRadius: '4px',
                    fontSize: '11px',
                    fontWeight: '600',
                    lineHeight: '1',
                    background: 'rgba(39, 174, 96, 0.15)',
                    color: COLORS.accent.success,
                    border: `1px solid rgba(39, 174, 96, 0.3)`
                  }}
                >
                  {num}
                </span>
              ))}
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
            gap: '7px',
            minHeight: '34px',
            alignItems: 'flex-start',
            justifyContent: 'flex-start'
          }}>
            {missesArray.map(num => (
                <span
                  key={num}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '34px',
                    height: '34px',
                    borderRadius: '4px',
                    fontSize: '11px',
                    fontWeight: '600',
                    lineHeight: '1',
                    background: 'rgba(235, 77, 75, 0.15)',
                    color: COLORS.accent.error,
                    border: `1px solid rgba(235, 77, 75, 0.3)`
                  }}
                >
                  {num}
                </span>
              ))}
          </div>
        )}
      </div>
      
      {/* Live Stats Button */}
      <button
        onClick={showLiveStats}
        style={{
          marginTop: '4px',
          width: '100%',
          padding: '6px 10px',
          background: COLORS.bg.darker,
          color: COLORS.accent.info,
          border: `1px solid ${COLORS.border.light}`,
          borderRadius: BORDER_RADIUS.sm,
          fontSize: '11px',
          fontWeight: '600',
          cursor: 'pointer',
          transition: 'all 0.2s',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '6px'
        }}
        onMouseEnter={(e) => {
          e.target.style.background = COLORS.bg.darkest;
          e.target.style.borderColor = COLORS.accent.info;
        }}
        onMouseLeave={(e) => {
          e.target.style.background = COLORS.bg.darker;
          e.target.style.borderColor = COLORS.border.light;
        }}
      >
        <Radio size={12} strokeWidth={2} />
        <span>Live Stats</span>
      </button>
    </div>
  );
}
