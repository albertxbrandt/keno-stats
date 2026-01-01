// src/ui/components/sections/HitsMissSection.jsx
// Simple display component showing hits and misses from the last round
// Updates automatically when state.trackerHits or state.trackerMisses change

import { useEffect, useState } from 'preact/hooks';
import { state } from '@/games/keno/core/state.js';
import { stateEvents, EVENTS } from '@/games/keno/core/stateEvents.js';
import { useModals } from '@/games/keno/hooks/useModals.js';
import { COLORS } from '@/shared/constants/colors.js';
import { BORDER_RADIUS, SPACING } from '@/shared/constants/styles.js';

/**
 * HitsMissSection Component
 * 
 * Displays the hits and misses from the most recent Keno round.
 * Hits are numbers you selected that were drawn (green).
 * Misses are numbers that were drawn but you didn't select (red).
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
  // Local state to trigger re-renders when global state changes
  const [hits, setHits] = useState('-');
  const [misses, setMisses] = useState('-');
  const { showLiveStats } = useModals();

  // Subscribe to round updates
  useEffect(() => {
    const updateFromState = () => {
      setHits(state.trackerHits || '-');
      setMisses(state.trackerMisses || '-');
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
      <div style={{ color: COLORS.accent.success, fontSize: '12px' }}>
        Hits: <span id="tracker-hits">{hits}</span>
      </div>
      <div style={{ color: COLORS.accent.error, fontSize: '12px', marginTop: '4px' }}>
        Miss: <span id="tracker-misses">{misses}</span>
      
      {/* Live Stats Button */}
      <button
        onClick={showLiveStats}
        style={{
          marginTop: '8px',
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
        <span>📡</span>
        <span>Live Stats</span>
      </button>
      </div>
    </div>
  );
}
