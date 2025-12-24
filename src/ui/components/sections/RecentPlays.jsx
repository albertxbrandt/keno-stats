import { h } from 'preact';
import { useState, useEffect } from 'preact/hooks';
import { getRecentlyPlayed } from '../../features/savedNumbersCore.js';
import { stateEvents, EVENTS } from '../../core/stateEvents.js';
import { waitForBetButtonReady } from '../../utils/utils.js';
import { replaceSelection } from '../../utils/tileSelection.js';

/**
 * Recent play item component
 */
function PlayItem({ play, onSelect }) {
  const [isHovered, setIsHovered] = useState(false);

  const timeAgo = Math.floor((Date.now() - play.playedAt) / 1000 / 60);
  const timeDisplay = timeAgo < 1 ? 'just now' : `${timeAgo}m ago`;

  return (
    <div
      onClick={() => onSelect(play.numbers)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '6px 8px',
        background: isHovered ? '#1a2c38' : '#0f212e',
        borderRadius: '4px',
        cursor: 'pointer',
        transition: 'background 0.2s'
      }}
    >
      <span
        style={{
          color: '#fff',
          fontSize: '11px',
          fontWeight: 'bold'
        }}
      >
        {play.numbers.join(', ')}
      </span>
      <span
        style={{
          color: '#666',
          fontSize: '9px'
        }}
      >
        {timeDisplay}
      </span>
    </div>
  );
}

/**
 * Recent plays section component
 */
export function RecentPlays() {
  const [plays, setPlays] = useState([]);

  // Load recent plays on mount and subscribe to updates
  useEffect(() => {
    getRecentlyPlayed().then(setPlays);

    const unsubscribe = stateEvents.on(EVENTS.ROUND_SAVED, () => {
      getRecentlyPlayed().then(setPlays);
    });

    return unsubscribe;
  }, []);

  const handleSelect = async (numbers) => {
    try {
      await waitForBetButtonReady(3000);
      await replaceSelection(numbers);
    } catch (err) {
      console.warn('[RecentPlays] Failed to select numbers:', err);
    }
  };

  if (plays.length === 0) {
    return (
      <div
        style={{
          color: '#666',
          fontSize: '10px',
          padding: '8px',
          textAlign: 'center'
        }}
      >
        No recent plays
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      {plays.map((play) => (
        <PlayItem key={play.playedAt} play={play} onSelect={handleSelect} />
      ))}
    </div>
  );
}
