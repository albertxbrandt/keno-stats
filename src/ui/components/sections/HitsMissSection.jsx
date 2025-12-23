// src/ui/components/sections/HitsMissSection.jsx
// Simple display component showing hits and misses from the last round
// Updates automatically when state.trackerHits or state.trackerMisses change

import { useEffect, useState } from 'preact/hooks';
// eslint-disable-next-line no-unused-vars
import { state } from '../../../core/state.js';

/**
 * HitsMissSection Component
 * 
 * Displays the hits and misses from the most recent Keno round.
 * Hits are numbers you selected that were drawn (green).
 * Misses are numbers that were drawn but you didn't select (red).
 * 
 * This is a simple non-collapsible section that always shows current round results.
 * 
 * @component
 * @returns {preact.VNode} The rendered component
 * 
 * @example
 * <HitsMissSection />
 * 
 * @note CURRENT IMPLEMENTATION (TEMPORARY):
 * - Uses polling (setInterval) to read from DOM elements updated by old overlay.js
 * - This is a bridge pattern during migration - NOT the final approach
 * - Reads from #tracker-hits and #tracker-misses elements every 500ms
 * 
 * @todo REFACTOR NEEDED:
 * 1. Remove DOM polling completely - never use setInterval for state sync
 * 2. Get data directly from state object (state.trackerHits, state.trackerMisses)
 * 3. Trigger re-render when new round data comes from interceptor.js
 * 4. Options for event system:
 *    - Add event emitter to state.js (emit 'round-complete' event)
 *    - Use Preact context provider for state updates
 *    - Add callback registration in content.js message handler
 * 5. Data should flow: interceptor.js → content.js → state update → component re-render
 * 
 * @architecture-note
 * The proper flow should be:
 * 1. interceptor.js captures bet data from GraphQL response
 * 2. Posts message to content.js via window.postMessage()
 * 3. content.js updates state.trackerHits and state.trackerMisses
 * 4. State change triggers component re-render (no polling needed)
 */
export function HitsMissSection() {
  // Local state to trigger re-renders when global state changes
  const [hits, setHits] = useState('-');
  const [misses, setMisses] = useState('-');

  // TEMPORARY: Poll state for changes
  // TODO: REMOVE THIS - Replace with direct state subscription or event-driven updates
  useEffect(() => {
    const updateFromState = () => {
      // HACK: Read from DOM elements that are updated by old overlay.js
      // This is a bridge during migration - NOT the final approach
      const hitsEl = document.getElementById('tracker-hits');
      const missesEl = document.getElementById('tracker-misses');
      
      if (hitsEl) setHits(hitsEl.innerText || '-');
      if (missesEl) setMisses(missesEl.innerText || '-');
    };

    // Initial update
    updateFromState();

    // Poll every 500ms for changes
    // TODO: Replace with state.trackerHits/state.trackerMisses subscription
    const interval = setInterval(updateFromState, 500);

    return () => clearInterval(interval);
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
