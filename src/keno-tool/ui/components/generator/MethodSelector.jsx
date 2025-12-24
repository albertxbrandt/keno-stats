// src/ui/components/generator/MethodSelector.jsx
// Dropdown selector for generator method with all available options

import { useState, useEffect } from 'preact/hooks';
import { state } from '@/keno-tool/core/state.js';
import { saveGeneratorSettings } from '@/keno-tool/core/storage.js';

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
    <div style={{ marginBottom: '8px' }}>
      <span style={{ color: '#aaa', fontSize: '10px' }}>
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
          fontSize: '11px'
        }}
      >
        <option value="frequency">🔥 Frequency (Hot Numbers)</option>
        <option value="cold">❄️ Cold (Least Frequent)</option>
        <option value="mixed">🔀 Mixed (Hot + Cold)</option>
        <option value="average">📊 Average (Median Frequency)</option>
        <option value="momentum">⚡ Momentum (Trending)</option>
        <option value="auto">🤖 Auto (Best Performer)</option>
        <option value="shapes">🔷 Shapes (Board Patterns)</option>
      </select>
    </div>
  );
}
