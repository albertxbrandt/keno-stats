// src/ui/components/sections/RecentPlaysSection.jsx
// Recent plays section - displays recently played number combinations

import { useState, useEffect } from 'preact/hooks';
// eslint-disable-next-line no-unused-vars
import { CollapsibleSection } from '../shared/CollapsibleSection.jsx';

/**
 * RecentPlaysSection Component
 * 
 * Displays a list of recently played number combinations
 * 
 * Features:
 * - Recent plays list
 * - Saved combos button in header
 * 
 * @component
 * @returns {preact.VNode} The rendered recent plays section
 */
export function RecentPlaysSection() {
  const [recentPlays, setRecentPlays] = useState([]);

  // Update recent plays from window hook
  useEffect(() => {
    const updateRecentPlays = () => {
      if (window.__keno_getRecentPlays) {
        setRecentPlays(window.__keno_getRecentPlays() || []);
      }
    };

    updateRecentPlays();

    // Poll for updates (TODO: Replace with event-driven)
    const interval = setInterval(updateRecentPlays, 2000);

    return () => clearInterval(interval);
  }, []);

  const handleViewSavedNumbers = () => {
    if (window.__keno_viewSavedNumbers) {
      window.__keno_viewSavedNumbers();
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
                padding: '6px',
                marginBottom: '4px',
                background: '#0f212e',
                borderRadius: '3px',
                fontSize: '10px',
                color: '#fff',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
            >
              <span>{play.numbers?.join(', ') || 'Unknown'}</span>
              {play.timestamp && (
                <span style={{ color: '#666', fontSize: '8px' }}>
                  {new Date(play.timestamp).toLocaleTimeString()}
                </span>
              )}
            </div>
          ))
        )}
      </div>
    </CollapsibleSection>
  );
}
