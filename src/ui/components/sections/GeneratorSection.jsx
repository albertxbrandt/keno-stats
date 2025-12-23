// src/ui/components/sections/GeneratorSection.jsx
// Main generator section that composes all generator sub-components
// Handles method-specific parameter visibility and number selection

import { useState, useEffect } from 'preact/hooks';
import { state } from '../../../core/state.js';
// eslint-disable-next-line no-unused-vars
import { CollapsibleSection } from '../shared/CollapsibleSection.jsx';
// eslint-disable-next-line no-unused-vars
import { NumberInput } from '../shared/NumberInput.jsx';
// eslint-disable-next-line no-unused-vars
import { GeneratorPreview } from '../generator/GeneratorPreview.jsx';
// eslint-disable-next-line no-unused-vars
import { MethodSelector } from '../generator/MethodSelector.jsx';
// eslint-disable-next-line no-unused-vars
import { AutoRefreshControl } from '../generator/AutoRefreshControl.jsx';
// eslint-disable-next-line no-unused-vars
import { ShapesParams } from '../generator/ShapesParams.jsx';
// eslint-disable-next-line no-unused-vars
import { MomentumParams } from '../generator/MomentumParams.jsx';
import { saveGeneratorSettings } from '../../../core/storage.js';

/**
 * GeneratorSection Component
 * 
 * Main number generator section of the overlay.
 * Composed of several sub-components:
 * - Count input: How many numbers to generate
 * - Sample size input: How many rounds to analyze
 * - Method selector: Which algorithm to use
 * - Method-specific params (Shapes, Momentum, etc.)
 * - Auto-refresh control: Automatic refresh settings
 * - Preview: Shows next numbers with countdown
 * - Select button: Applies predictions to board
 * - Compare button: Opens method comparison window
 * 
 * @component
 * @returns {preact.VNode} Complete generator section
 * 
 * @example
 * <GeneratorSection />
 */
export function GeneratorSection() {
  const [count, setCount] = useState(state.generatorCount || 3);
  const [sampleSize, setSampleSize] = useState(state.generatorSampleSize || 20);
  const [selectedMethod, setSelectedMethod] = useState(state.generatorMethod || 'frequency');

  // Determine which method uses which params
  const usesFrequencyParams = ['frequency', 'cold', 'mixed', 'average', 'auto'].includes(selectedMethod);
  const showShapesParams = selectedMethod === 'shapes';
  const showMomentumParams = selectedMethod === 'momentum';

  // Sync with global state on mount
  useEffect(() => {
    setCount(state.generatorCount || 3);
    setSampleSize(state.generatorSampleSize || 20);
    setSelectedMethod(state.generatorMethod || 'frequency');
  }, []);

  // Update max sample size based on history length
  const maxSampleSize = Math.max(state.currentHistory?.length || 1, 1);

  const handleCountChange = (value) => {
    setCount(value);
    state.generatorCount = value;
    saveGeneratorSettings();
  };

  const handleSampleSizeChange = (value) => {
    const clamped = Math.max(1, Math.min(maxSampleSize, value));
    setSampleSize(clamped);
    state.generatorSampleSize = clamped;
    saveGeneratorSettings();
  };

  const handleMethodChange = (newMethod) => {
    setSelectedMethod(newMethod);
    
    // Update legacy state for backward compatibility
    state.isMomentumMode = newMethod === 'momentum';

    // Force refresh with new method
    if (window.__keno_generateNumbers) {
      window.__keno_generateNumbers(true);
    }
  };

  const handleSelectClick = async () => {
    // Apply preview numbers and generate new ones
    if (state.nextNumbers && state.nextNumbers.length > 0) {
      state.generatedNumbers = state.nextNumbers;
      
      if (window.__keno_selectPredictedNumbers) {
        await window.__keno_selectPredictedNumbers();
      }

      // Generate new preview
      if (window.__keno_generateNumbers) {
        await window.__keno_generateNumbers(true);
      }

      // Update preview
      if (window.__keno_updateGeneratorPreview) {
        window.__keno_updateGeneratorPreview();
      }

      // Refresh highlight if hovering
      if (window.__keno_isButtonHovering && window.__keno_isButtonHovering()) {
        if (window.__keno_refreshPreviewHighlight) {
          window.__keno_refreshPreviewHighlight();
        }
      }
    }
  };

  const handleCompareClick = () => {
    if (window.__keno_openMethodComparison) {
      window.__keno_openMethodComparison();
    }
  };

  return (
    <CollapsibleSection
      title="🎲 Number Generator"
      icon={null}
      dataSection="generator"
      titleColor="#74b9ff"
      maxHeight={650}
      defaultExpanded={true}
      pinnable={true}
    >
      {/* Count input */}
      <div style={{ marginBottom: '8px' }}>
        <span style={{ color: '#aaa', fontSize: '10px' }}>
          Count:
        </span>
        <NumberInput
          value={count}
          onChange={handleCountChange}
          min={1}
          max={10}
          step={1}
          width="100%"
        />
      </div>

      {/* Sample size input (for frequency-based methods) */}
      {usesFrequencyParams && (
        <div style={{ marginBottom: '8px' }}>
          <span style={{ color: '#aaa', fontSize: '10px' }}>
            Sample Size (last N games):
          </span>
          <NumberInput
            value={sampleSize}
            onChange={handleSampleSizeChange}
            min={1}
            max={maxSampleSize}
            step={1}
            width="100%"
          />
        </div>
      )}

      {/* Method selector */}
      <MethodSelector onChange={handleMethodChange} />

      {/* Method-specific parameters */}
      {showShapesParams && <ShapesParams />}
      {showMomentumParams && <MomentumParams />}

      {/* Auto-refresh control */}
      <AutoRefreshControl />

      {/* Preview */}
      <GeneratorPreview />

      {/* Action buttons */}
      <button
        onClick={handleSelectClick}
        id="generate-numbers-btn"
        style={{
          width: '100%',
          background: '#74b9ff',
          color: '#fff',
          border: 'none',
          padding: '8px',
          borderRadius: '4px',
          fontWeight: 'bold',
          cursor: 'pointer',
          fontSize: '12px',
          marginTop: '0px'
        }}
      >
        Select
      </button>

      <button
        onClick={handleCompareClick}
        style={{
          width: '100%',
          background: '#2a3f4f',
          color: '#74b9ff',
          border: '1px solid #3a5f6f',
          padding: '4px',
          borderRadius: '4px',
          cursor: 'pointer',
          fontSize: '9px',
          marginTop: '4px'
        }}
      >
        📊 Compare Methods
      </button>
    </CollapsibleSection>
  );
}
