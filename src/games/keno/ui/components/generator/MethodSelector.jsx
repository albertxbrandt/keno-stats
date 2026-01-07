// src/ui/components/generator/MethodSelector.jsx
// Dropdown selector for generator method with all available options

import { useState, useEffect } from 'preact/hooks';
import { state } from '@/games/keno/core/state.js';
import { saveGeneratorSettings } from '@/games/keno/core/storage.js';
import { SPACING, FONT_SIZES } from '@/shared/constants/styles.js';

/**
 * MethodSelector Component
 * 
 * Dropdown for selecting the number generation method.
 * Available methods:
 * - Frequency (Hot Numbers) - Most frequently drawn
 * - Cold (Least Frequent) - Least frequently drawn
 * - Mixed (Hot + Cold) - Combination approach
 * - Average (Median Frequency) - Numbers with median draw frequency
 * - Momentum (Trending) - Numbers showing upward trend
 * - Auto (Best Performer) - Automatically selects best performing method
 * - Shapes (Board Patterns) - Geometric patterns on the board
 * 
 * @component
 * @param {Object} props
 * @param {Function} props.onChange - Callback when method changes (receives new method value)
 * @returns {preact.VNode} Method selector dropdown
 * 
 * @example
 * <MethodSelector onChange={(method) => console.log('Method changed:', method)} />
 */
export function MethodSelector({ onChange }) {
  const [selectedMethod, setSelectedMethod] = useState(state.generatorMethod || 'frequency');

  // Sync with global state on mount
  useEffect(() => {
    setSelectedMethod(state.generatorMethod || 'frequency');
  }, []);

  const handleChange = (e) => {
    const newMethod = e.target.value;
    setSelectedMethod(newMethod);
    state.generatorMethod = newMethod;
    
    // Save to storage (auto-updates preview)
    saveGeneratorSettings();

    // Notify parent component
    if (onChange) {
      onChange(newMethod);
    }
  };

  return (
    <div style={{ marginBottom: SPACING.sm }}>
      <span style={{ color: '#aaa', fontSize: FONT_SIZES.sm }}>
        Method:
      </span>
      <select
        value={selectedMethod}
        onChange={handleChange}
        style={{
          width: '100%',
          background: '#14202b',
          border: '1px solid #444',
          color: '#fff',
          padding: '6px',
          borderRadius: '4px',
          marginTop: '4px',
          cursor: 'pointer',
          fontSize: FONT_SIZES.base
        }}
      >
        <option value="frequency">Hot Numbers</option>
        <option value="cold">Cold Numbers</option>
        <option value="random">Random (Pure Luck)</option>
        <option value="mixed">Mixed (Hot + Cold)</option>
        <option value="average">Average (Median Frequency)</option>
        <option value="momentum">Trending</option>
        <option value="shapes">Shapes</option>
        <option value="auto">Auto</option>
      </select>
    </div>
  );
}
