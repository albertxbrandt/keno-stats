// src/ui/components/sections/RecentPlaysSection.jsx
// Recent plays section - displays recently played number combinations

import { useState, useEffect } from 'preact/hooks';
import { CollapsibleSection } from '../shared/CollapsibleSection.jsx';
import { state } from '../../../core/state.js';

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
    if (window.__keno_showSavedNumbers) {
      window.__keno_showSavedNumbers();
    }
  };

  const handleSelectNumbers = (numbers) => {
    if (window.__keno_selectNumbers) {
      window.__keno_selectNumbers(numbers);
    }
  };

  const handleShowInfo = (numbers) => {
    if (window.__keno_analyzeCombination) {
      window.__keno_analyzeCombination(numbers, 'Recent Play');
    }
  };

  return (
    <CollapsibleSection
      icon="🎯"
      title="Recent Plays"
      defaultExpanded={false}
      headerExtra={
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleViewSavedNumbers();
          }}
          style={{
            background: '#2a3b4a',
            color: '#74b9ff',
            border: 'none',
            padding: '3px 8px',
            borderRadius: '4px',
            fontSize: '9px',
            cursor: 'pointer',
            fontWeight: 'bold',
            transition: 'background 0.2s'
          }}
          onMouseEnter={(e) => e.target.style.background = '#344e64'}
          onMouseLeave={(e) => e.target.style.background = '#2a3b4a'}
        >
          Saved Combos
        </button>
      }
    >
      <div
        id="recent-played-list"
        style={{
          minHeight: '60px',
          maxHeight: '200px',
          overflowY: 'auto',
          background: '#14202b',
          borderRadius: '4px',
          padding: '8px'
        }}
      >
        {recentPlays.length === 0 ? (
          <div style={{
            color: '#666',
            fontSize: '10px',
            padding: '8px',
            textAlign: 'center'
          }}>
            No recent plays
          </div>
        ) : (
          recentPlays.map((play, index) => (
            <div
              key={index}
              style={{
                background: '#0f212e',
                padding: '8px',
                borderRadius: '4px',
                marginBottom: '6px',
                border: '1px solid #2a3b4a',
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
                  color: '#fff',
                  fontSize: '11px',
                  fontWeight: 'bold',
                  userSelect: 'none'
                }}
                onMouseEnter={(e) => e.target.style.color = '#74b9ff'}
                onMouseLeave={(e) => e.target.style.color = '#fff'}
              >
                {play.numbers.join(', ')}
              </div>
              <button
                onClick={() => handleShowInfo(play.numbers)}
                style={{
                  padding: '4px 8px',
                  background: '#2a3b4a',
                  color: '#74b9ff',
                  border: 'none',
                  borderRadius: '4px',
                  fontSize: '9px',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  transition: 'background 0.2s'
                }}
                onMouseEnter={(e) => e.target.style.background = '#344e64'}
                onMouseLeave={(e) => e.target.style.background = '#2a3b4a'}
              >
                ℹ️
              </button>
            </div>
          ))
        )}
      </div>
    </CollapsibleSection>
  );
}
