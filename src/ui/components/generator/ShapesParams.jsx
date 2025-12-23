// src/ui/components/generator/ShapesParams.jsx
// Configuration panel for Shapes generator method
// Pattern selection and placement strategy

import { useState, useEffect } from 'preact/hooks';
import { state } from '../../../core/state.js';
import { saveGeneratorSettings } from '../../../core/storage.js';

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
  const [currentShape, setCurrentShape] = useState('-');

  // Sync with global state on mount
  useEffect(() => {
    setPattern(state.shapesPattern || 'smart');
    setPlacement(state.shapesPlacement || 'random');
    
    // Update current shape display
    updateCurrentShapeDisplay();
  }, []);

  // TODO: Replace with event-driven updates
  useEffect(() => {
    const interval = setInterval(() => {
      updateCurrentShapeDisplay();
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const updateCurrentShapeDisplay = () => {
    const lastShape = state.shapesLastShape;
    if (lastShape && lastShape.emoji && lastShape.name && lastShape.numbers) {
      setCurrentShape(`${lastShape.emoji} ${lastShape.name}\n${lastShape.numbers.join(', ')}`);
    } else {
      setCurrentShape('-');
    }
  };

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
    <div style={{ marginBottom: '8px' }}>
      <div style={{ marginBottom: '8px' }}>
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
          <option value="smart">🧠 Smart Shape (Auto-Select Best)</option>
          <option value="random">🎲 Random (Weighted Variety)</option>
          <option value="plus">➕ Plus</option>
          <option value="cross">✖️ Cross</option>
          <option value="jesus">✝️ Jesus Saves</option>
          <option value="lShape">🔲 L-Shape</option>
          <option value="tShape">🅣 T-Shape</option>
          <option value="cShape">🌙 C-Shape</option>
          <option value="square">⬛ Square</option>
          <option value="lineHorizontal">➖ Horizontal Line</option>
          <option value="lineVertical">| Vertical Line</option>
          <option value="diagonalDown">↘️ Diagonal Down</option>
          <option value="diagonalUp">↗️ Diagonal Up</option>
          <option value="zigzag">⚡ Zigzag</option>
          <option value="arrow">➡️ Arrow</option>
        </select>
      </div>

      <div style={{ marginBottom: '8px' }}>
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
          <option value="random">🎲 Random Position</option>
          <option value="hot">🔥 Hot Numbers Area</option>
          <option value="cold">❄️ Cold Numbers Area</option>
          <option value="trending">📈 Trending Position</option>
        </select>
      </div>

      <div style={{
        padding: '6px',
        background: '#14202b',
        borderRadius: '4px',
        border: '1px solid #fd79a830'
      }}>
        <div style={{
          color: '#fd79a8',
          fontSize: '9px',
          marginBottom: '2px'
        }}>
          Current Shape:
        </div>
        <div style={{
          color: '#aaa',
          fontSize: '9px',
          lineHeight: '1.4',
          whiteSpace: 'pre-line'
        }}>
          {currentShape}
        </div>
      </div>
    </div>
  );
}
