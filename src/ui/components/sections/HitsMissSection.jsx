// src/ui/components/sections/HitsMissSection.jsx
// Simple display component showing hits and misses from the last round
// Updates automatically when state.trackerHits or state.trackerMisses change

import { useEffect, useState } from 'preact/hooks';
import { state } from '../../../core/state.js';
import { stateEvents, EVENTS } from '../../../core/stateEvents.js';

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
      marginBottom: '15px',
      background: '#0f212e',
      padding: '8px',
      borderRadius: '4px'
    }}>
      <div style={{ color: '#00b894', fontSize: '12px' }}>
        Hits: <span id="tracker-hits">{hits}</span>
      </div>
      <div style={{ color: '#ff7675', fontSize: '12px', marginTop: '4px' }}>
        Miss: <span id="tracker-misses">{misses}</span>
      </div>
    </div>
  );
}
