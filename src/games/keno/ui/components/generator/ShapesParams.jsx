// src/ui/components/generator/ShapesParams.jsx
// Configuration panel for Shapes generator method
// Pattern selection and placement strategy

import { useState, useEffect } from 'preact/hooks';
import { state } from '@/games/keno/core/state.js';
import { stateEvents, EVENTS } from '@/games/keno/core/stateEvents.js';
import { saveGeneratorSettings } from '@/games/keno/core/storage.js';
import { SPACING } from '@/shared/constants/styles.js';

/**
 * ShapesParams Component
 * 
 * Parameters specific to the Shapes generator method:
 * - Pattern selector: Which geometric shape to use
 * - Placement selector: Where to place the shape on the board
 * - Current shape display: Shows last generated shape info
 * 
 * Only displayed when generator method is set to 'shapes'.
 * 
 * @component
 * @returns {preact.VNode} Shapes configuration panel
 * 
 * @example
 * <ShapesParams />
 */
export function ShapesParams() {
  const [pattern, setPattern] = useState(state.shapesPattern || 'smart');
  const [placement, setPlacement] = useState(state.shapesPlacement || 'random');

  // Sync with global state on mount and when generator updates
  useEffect(() => {
    const updateFromState = () => {
      setPattern(state.shapesPattern || 'smart');
      setPlacement(state.shapesPlacement || 'random');
    };

    // Initial update
    updateFromState();
    
    // Subscribe to state change events
    const unsubSettings = stateEvents.on(EVENTS.SETTINGS_CHANGED, updateFromState);

    return () => {
      unsubSettings();
    };
  }, []);


  const handlePatternChange = (e) => {
    const newPattern = e.target.value;
    setPattern(newPattern);
    state.shapesPattern = newPattern;
    saveGeneratorSettings();
  };

  const handlePlacementChange = (e) => {
    const newPlacement = e.target.value;
    setPlacement(newPlacement);
    state.shapesPlacement = newPlacement;
    saveGeneratorSettings();
  };

  return (
    <div style={{ marginBottom: SPACING.sm }}>
      <div style={{ marginBottom: SPACING.sm }}>
        <span style={{ color: '#aaa', fontSize: '10px' }}>Pattern:</span>
        <select
          value={pattern}
          onChange={handlePatternChange}
          style={{
            width: '100%',
            background: '#14202b',
            border: '1px solid #444',
            color: '#fff',
            padding: '4px',
            borderRadius: '4px',
            fontSize: '10px',
            marginTop: '4px'
          }}
        >
          <option value="smart">Smart Shape (Auto-Select Best)</option>
          <option value="random">Random (Weighted Variety)</option>
          <option value="plus">Plus</option>
          <option value="cross">Cross</option>
          <option value="jesus">Jesus Saves</option>
          <option value="lShape">L-Shape</option>
          <option value="tShape">T-Shape</option>
          <option value="cShape">C-Shape</option>
          <option value="square">Square</option>
          <option value="lineHorizontal">Horizontal Line</option>
          <option value="lineVertical">| Vertical Line</option>
          <option value="diagonalDown">Diagonal Down</option>
          <option value="diagonalUp">Diagonal Up</option>
          <option value="zigzag">Zigzag</option>
          <option value="arrow">Arrow</option>
        </select>
      </div>

      <div style={{ marginBottom: SPACING.sm }}>
        <span style={{ color: '#aaa', fontSize: '10px' }}>Placement:</span>
        <select
          value={placement}
          onChange={handlePlacementChange}
          style={{
            width: '100%',
            background: '#14202b',
            border: '1px solid #444',
            color: '#fff',
            padding: '4px',
            borderRadius: '4px',
            fontSize: '10px',
            marginTop: '4px'
          }}
        >
          <option value="random">Random Position</option>
          <option value="hot">Hot Numbers Area</option>
          <option value="cold">Cold Numbers Area</option>
          <option value="trending">Trending Position</option>
        </select>
      </div>
    </div>
  );
}
