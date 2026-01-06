// src/ui/components/generator/GeneratorPreview.jsx
// Preview component showing "next numbers" that will be generated
// Displays method name, countdown, and predicted numbers with hit/miss styling

import { useState, useEffect, useRef } from 'preact/hooks';
import { state } from '@/games/keno/core/state.js';
import { stateEvents, EVENTS } from '@/games/keno/core/stateEvents.js';
import { initPreviewBoxHighlight } from '@/games/keno/ui/previewHighlight.js';
import { ToggleSwitch } from '@/shared/components/ToggleSwitch';
import { COLORS } from '@/shared/constants/colors.js';
import { BORDER_RADIUS, SPACING, FONT_SIZES } from '@/shared/constants/styles.js';

/**
 * GeneratorPreview Component
 * 
 * Displays a preview of the next numbers that will be selected when clicking "Select".
 * Shows:
 * - Method name with icon (e.g., "Hot")
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
 * Preview updates automatically when settings change (via stateEvents).
 */
export function GeneratorPreview() {
  const [methodDisplay, setMethodDisplay] = useState('Hot');
  const [countdown, setCountdown] = useState('Manual');
  const [countdownColor, setCountdownColor] = useState('#666');
  const [previewNumbers, setPreviewNumbers] = useState([]);
  const [alwaysShowPreview, setAlwaysShowPreview] = useState(state.generatorAlwaysShowPreview || false);
  const previewContainerRef = useRef(null);

  // Method name mappings
  const methodNames = {
    'frequency': 'Hot',
    'cold': 'Cold',
    'mixed': 'Mixed',
    'average': 'Average',
    'momentum': 'Trending',
    'auto': 'Auto',
    'shapes': 'Shapes'
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
      } else if (state.generatorAdvancedRules?.enabled) {
        // Advanced rules: condition-based, not interval-based
        const roundsSinceRefresh = currentRound - lastRefresh;
        setCountdown(`${roundsSinceRefresh} rounds (rules)`);
        setCountdownColor(COLORS.accent.warning);
      } else {
        // Standard interval-based refresh
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

    return () => {
      unsubPreview();
      unsubHistory();
    };
  }, []);

  // Handle toggle change
  const handleToggleChange = (e) => {
    const checked = e.target.checked;
    setAlwaysShowPreview(checked);
    state.generatorAlwaysShowPreview = checked;
    // Save directly to storage without emitting events that trigger preview refresh
    const storageApi = typeof browser !== 'undefined' ? browser : chrome;
    storageApi.storage.local.get('generatorSettings', (result) => {
      const settings = result.generatorSettings || {};
      settings.generatorAlwaysShowPreview = checked;
      storageApi.storage.local.set({ generatorSettings: settings });
    });
    // Manually trigger highlight show/hide based on new state
    // The previewHighlight module reads state.generatorAlwaysShowPreview directly
    if (checked && state.nextNumbers && state.nextNumbers.length > 0) {
      // Show preview immediately when toggled on
      const highlightEvent = new CustomEvent('keno-show-preview');
      window.dispatchEvent(highlightEvent);
    } else if (!checked) {
      // Hide preview when toggled off (unless hovering)
      const clearEvent = new CustomEvent('keno-hide-preview');
      window.dispatchEvent(clearEvent);
    }
  };

  // Initialize preview box highlight
  useEffect(() => {
    if (previewContainerRef.current) {
      initPreviewBoxHighlight(previewContainerRef.current);
    }
  }, []);

  return (
    <div
      ref={previewContainerRef}
      style={{
        marginTop: SPACING.sm,
        marginBottom: SPACING.sm,
        padding: SPACING.sm,
        background: COLORS.bg.darkest,
        borderRadius: BORDER_RADIUS.sm,
        border: `1px solid ${COLORS.border.light}`,
        cursor: 'pointer'
      }}>
      {/* Header Row */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: SPACING.xs
      }}>
        <span style={{
          color: COLORS.accent.info,
          fontSize: FONT_SIZES.xs,
          fontWeight: '600'
        }}>
          Next Numbers
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{
            color: COLORS.text.tertiary,
            fontSize: FONT_SIZES.xs
          }}>
            {methodDisplay}
          </span>
          <span style={{
            color: countdownColor,
            fontSize: FONT_SIZES.xs,
            fontWeight: '600'
          }}>
            {countdown}
          </span>
        </div>
      </div>

      {/* Numbers Display */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '4px',
        minHeight: '24px',
        alignItems: 'center',
        marginBottom: SPACING.xs
      }}>
        {previewNumbers.length === 0 ? (
          <span style={{ color: COLORS.text.tertiary, fontSize: '11px' }}>-</span>
        ) : (
          previewNumbers.map(({ number, wasHit }) => {
            const baseStyle = {
              display: 'inline-block',
              padding: '4px 8px',
              borderRadius: '4px',
              fontSize: FONT_SIZES.xs,
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

      {/* Toggle Row */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: SPACING.xs,
        marginTop: SPACING.sm,
        paddingTop: SPACING.xs,
        borderTop: `1px solid ${COLORS.border.default}`
      }}>
        <ToggleSwitch
          checked={alwaysShowPreview}
          onChange={handleToggleChange}
          label=""
          labelSize={FONT_SIZES.xs}
        />
        <span style={{
          color: COLORS.text.secondary,
          fontSize: FONT_SIZES.xs
        }}>
          Highlight
        </span>
      </div>
    </div>
  );
}
