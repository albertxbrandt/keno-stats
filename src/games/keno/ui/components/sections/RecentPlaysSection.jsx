// src/ui/components/sections/RecentPlaysSection.jsx
// Recent plays section - displays recently played number combinations

import { useState, useEffect } from 'preact/hooks';
import { CollapsibleSection } from '@/shared/components/CollapsibleSection';
import { Clock, Info } from 'lucide-preact';
import { Button } from '@/shared/components/Button';
import { state } from '@/games/keno/core/state.js';
import { useModals } from '@/games/keno/hooks/useModals.js';
import { replaceSelection } from '@/shared/utils/dom/tileSelection.js';
import { waitForBetButtonReady } from '@/shared/utils/dom/utils.js';
import { COLORS } from '@/shared/constants/colors.js';
import { BORDER_RADIUS, SPACING, FONT_SIZES } from '@/shared/constants/styles.js';

/**
 * RecentPlaysSection Component
 * 
 * Displays a list of recently played number combinations
 * 
 * Features:
 * - Live updating recent plays list
 * - Click to select numbers on board
 * - Info button to view combination stats
 * - Saved combos button in header
 * 
 * @component
 * @returns {preact.VNode} The rendered recent plays section
 */
export function RecentPlaysSection() {
  const [recentPlays, setRecentPlays] = useState([]);
  const modals = useModals();

  // Update recent plays - listen to kenoNewRound event for live updates
  useEffect(() => {
    const updateRecentPlays = () => {
      setRecentPlays([...state.recentPlays]); // Use state directly for live updates
    };

    // Initial load
    updateRecentPlays();

    // Listen for new rounds
    window.addEventListener('kenoNewRound', updateRecentPlays);

    return () => {
      window.removeEventListener('kenoNewRound', updateRecentPlays);
    };
  }, []);

  const handleViewSavedNumbers = () => {
    modals.showSavedNumbers();
  };

  const handleSelectNumbers = async (numbers) => {
    try {
      await waitForBetButtonReady(3000);
      await replaceSelection(numbers);
    } catch (err) {
      console.warn('[RecentPlays] Failed to select numbers:', err);
    }
  };

  const handleShowInfo = (numbers) => {
    modals.showCombinationHits(numbers, 'Recent Play');
  };

  return (
    <CollapsibleSection
      icon={<Clock size={14} strokeWidth={2} />}
      title="Recent Plays"
      defaultExpanded={false}
      headerExtra={
        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            handleViewSavedNumbers();
          }}
          style={{ fontSize: FONT_SIZES.xs }}
        >
          Saved Combos
        </Button>
      }
    >
      <div
        id="recent-played-list"
        style={{
          minHeight: '60px',
          maxHeight: '200px',
          overflowY: 'auto',
          background: COLORS.bg.darkest,
          borderRadius: BORDER_RADIUS.sm,
          padding: SPACING.sm
        }}
      >
        {recentPlays.length === 0 ? (
          <div style={{
            color: COLORS.text.tertiary,
            fontSize: FONT_SIZES.xs,
            padding: SPACING.sm,
            textAlign: 'center'
          }}>
            No recent plays
          </div>
        ) : (
          recentPlays.map((play, index) => (
            <div
              key={index}
              style={{
                background: COLORS.bg.dark,
                padding: SPACING.sm,
                borderRadius: BORDER_RADIUS.sm,
                marginBottom: '6px',
                border: `1px solid ${COLORS.border.default}`,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
            >
              <div
                onClick={() => handleSelectNumbers(play.numbers)}
                style={{
                  flex: 1,
                  cursor: 'pointer',
                  color: COLORS.text.primary,
                  fontSize: FONT_SIZES.sm,
                  fontWeight: 'bold',
                  userSelect: 'none'
                }}
                onMouseEnter={(e) => e.target.style.color = COLORS.accent.info}
                onMouseLeave={(e) => e.target.style.color = COLORS.text.primary}
              >
                {play.numbers.join(', ')}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleShowInfo(play.numbers)}
                icon={<Info size={10} strokeWidth={2} />}
                style={{ fontSize: '9px', padding: SPACING.inputPadding }}
              />
            </div>
          ))
        )}
      </div>
    </CollapsibleSection>
  );
}
