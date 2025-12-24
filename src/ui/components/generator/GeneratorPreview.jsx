// src/ui/components/generator/GeneratorPreview.jsx
// Preview component showing "next numbers" that will be generated
// Displays method name, countdown, and predicted numbers with hit/miss styling

import { useState, useEffect } from 'preact/hooks';
import { state } from '../../../core/state.js';
import { stateEvents, EVENTS } from '../../../core/stateEvents.js';
import { COLORS } from '../../constants/colors.js';
import { BORDER_RADIUS, SPACING } from '../../constants/styles.js';

/**
 * GeneratorPreview Component
 * 
 * Displays a preview of the next numbers that will be selected when clicking "Select".
 * Shows:
 * - Method name with emoji (e.g., "🔥 Hot")
 * - Auto-refresh countdown (e.g., "2/5 rounds" or "Manual")
 * - Predicted numbers with visual feedback for hits from last round
 * 
 * @component
 * @returns {preact.VNode} The preview box
 * 
 * @example
 * <GeneratorPreview />
 * 
 * @note
 * Numbers that were hits in the last round appear with darker styling and inset shadow.
 * Preview updates automatically when settings change via window.__keno_updateGeneratorPreview.
 * 
 * @todo REFACTOR NEEDED:
 * - Remove dependency on window.__keno_updateGeneratorPreview hook
 * - Use proper event system or Preact context for updates
 * - Consider moving generator logic into hooks for better encapsulation
 */
export function GeneratorPreview() {
  const [methodDisplay, setMethodDisplay] = useState('🔥 Hot');
  const [countdown, setCountdown] = useState('Manual');
  const [countdownColor, setCountdownColor] = useState('#666');
  const [previewNumbers, setPreviewNumbers] = useState([]);

  // Method name mappings
  const methodNames = {
    'frequency': '🔥 Hot',
    'cold': '❄️ Cold',
    'mixed': '🔀 Mixed',
    'average': '📊 Average',
    'momentum': '⚡ Momentum',
    'auto': '🤖 Auto',
    'shapes': '🔷 Shapes'
  };

  // Update preview when state changes
  useEffect(() => {
    const updatePreview = () => {
      const currentMethod = state.generatorMethod || 'frequency';
      const autoRefresh = state.generatorAutoRefresh;
      const interval = state.generatorInterval || 5;
      const currentRound = state.currentHistory?.length || 0;
      const lastRefresh = state.generatorLastRefresh || 0;

      setMethodDisplay(methodNames[currentMethod] || currentMethod);

      // Update countdown
      if (!autoRefresh) {
        setCountdown('Manual');
        setCountdownColor(COLORS.text.tertiary);
      } else {
        const roundsSinceRefresh = currentRound - lastRefresh;
        const roundsUntilRefresh = Math.max(0, interval - roundsSinceRefresh);
        setCountdown(`${roundsUntilRefresh}/${interval} rounds`);
        setCountdownColor(roundsUntilRefresh === 0 ? COLORS.accent.success : COLORS.accent.info);
      }

      // Get preview numbers from state.nextNumbers (set by numberSelection.js)
      const nextNums = state.nextNumbers || [];
      
      // Get last round's drawn numbers for hit/miss styling
      const lastRoundDrawn = new Set();
      const history = state.currentHistory || [];
      if (history.length > 0) {
        const lastRound = history[history.length - 1];
        const drawnNumbers = lastRound.drawn || 
                           lastRound.kenoBet?.state?.drawnNumbers || 
                           lastRound.kenoBet?.drawnNumbers;
        
        if (drawnNumbers) {
          drawnNumbers.forEach(num => lastRoundDrawn.add(num));
        }
      }

      // Build preview array with hit/miss metadata
      setPreviewNumbers(nextNums.map(num => ({
        number: num,
        wasHit: lastRoundDrawn.has(num)
      })));
    };

    // Initial update
    updatePreview();

    // Subscribe to state change events
    const unsubPreview = stateEvents.on(EVENTS.GENERATOR_PREVIEW_UPDATED, updatePreview);
    const unsubHistory = stateEvents.on(EVENTS.HISTORY_UPDATED, updatePreview);
    const unsubSettings = stateEvents.on(EVENTS.SETTINGS_CHANGED, updatePreview);

    return () => {
      unsubPreview();
      unsubHistory();
      unsubSettings();
    };
  }, []);

  return (
    <div style={{
      marginTop: SPACING.sm,
      marginBottom: SPACING.sm,
      padding: SPACING.sm,
      background: COLORS.bg.darkest,
      borderRadius: BORDER_RADIUS.sm,
      border: `1px solid ${COLORS.border.light}`
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '4px'
      }}>
        <span style={{
          color: COLORS.accent.info,
          fontSize: '9px',
          fontWeight: '600'
        }}>
          Next Numbers:
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{
            color: COLORS.text.tertiary,
            fontSize: '8px'
          }}>
            {methodDisplay}
          </span>
          <span style={{
            color: countdownColor,
            fontSize: '8px',
            fontWeight: '600'
          }}>
            {countdown}
          </span>
        </div>
      </div>
      
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '4px',
        minHeight: '24px',
        alignItems: 'center'
      }}>
        {previewNumbers.length === 0 ? (
          <span style={{ color: COLORS.text.tertiary, fontSize: '9px' }}>-</span>
        ) : (
          previewNumbers.map(({ number, wasHit }) => {
            const baseStyle = {
              display: 'inline-block',
              padding: '4px 8px',
              borderRadius: '4px',
              fontSize: '10px',
              fontWeight: '600',
              transition: 'all 0.2s'
            };

            if (wasHit) {
              // Hit in last round - darker with inset shadow
              return (
                <span
                  key={number}
                  style={{
                    ...baseStyle,
                    background: '#162026',
                    color: '#7a9fb5',
                    boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.6)',
                    border: '1px solid #0a1419'
                  }}
                >
                  {number}
                </span>
              );
            } else {
              // Not hit - normal bright style
              return (
                <span
                  key={number}
                  style={{
                    ...baseStyle,
                    background: '#2a3f4f',
                    color: '#74b9ff'
                  }}
                >
                  {number}
                </span>
              );
            }
          })
        )}
      </div>
    </div>
  );
}
