import { h } from 'preact';
import { useState, useEffect } from 'preact/hooks';
import { getRecentlyPlayed } from '@/keno-tool/features/savedNumbersCore.js';
import { stateEvents, EVENTS } from '@/keno-tool/core/stateEvents.js';
import { waitForBetButtonReady } from '@/shared/utils/utils.js';
import { replaceSelection } from '@/shared/utils/tileSelection.js';
import { COLORS } from '@/shared/constants/colors.js';
import { BORDER_RADIUS, SPACING } from '@/shared/constants/styles.js';

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
        padding: SPACING.inputPadding,
        background: isHovered ? COLORS.bg.darker : COLORS.bg.dark,
        borderRadius: BORDER_RADIUS.sm,
        cursor: 'pointer',
        transition: 'background 0.2s'
      }}
    >
      <span
        style={{
          color: COLORS.text.primary,
          fontSize: '11px',
          fontWeight: 'bold'
        }}
      >
        {play.numbers.join(', ')}
      </span>
      <span
        style={{
          color: COLORS.text.tertiary,
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
          color: COLORS.text.tertiary,
          fontSize: '10px',
          padding: SPACING.sm,
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
