// src/ui/components/sections/GeneratorSection.jsx
// Main generator section that composes all generator sub-components
// Handles method-specific parameter visibility and number selection

import { useState, useEffect } from 'preact/hooks';
import { state } from '../../../core/state.js';
import { CollapsibleSection } from '../shared/CollapsibleSection.jsx';
import { NumberInput } from '../shared/NumberInput.jsx';
import { GeneratorPreview } from '../generator/GeneratorPreview.jsx';
import { MethodSelector } from '../generator/MethodSelector.jsx';
import { AutoRefreshControl } from '../generator/AutoRefreshControl.jsx';
import { ShapesParams } from '../generator/ShapesParams.jsx';
import { MomentumParams } from '../generator/MomentumParams.jsx';
import { saveGeneratorSettings } from '../../../core/storage.js';
import { generateNumbers, selectPredictedNumbers } from '../../../ui/numberSelection.js';
import { useModals } from '../../../hooks/useModals.js';
import { COLORS } from '../../constants/colors.js';
import { BORDER_RADIUS, SPACING } from '../../constants/styles.js';

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
  const modals = useModals();

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
    generateNumbers(true);
  };

  const handleSelectClick = async () => {
    // eslint-disable-next-line no-console
    console.log('[GeneratorSection] Select clicked, nextNumbers:', state.nextNumbers);
    
    // Apply preview numbers and generate new ones
    if (state.nextNumbers && state.nextNumbers.length > 0) {
      state.generatedNumbers = state.nextNumbers;
      
      // eslint-disable-next-line no-console
      console.log('[GeneratorSection] Calling selectPredictedNumbers');
      await selectPredictedNumbers();

      // Generate new preview
      // eslint-disable-next-line no-console
      console.log('[GeneratorSection] Regenerating preview');
      await generateNumbers(true);
    } else {
      console.warn('[GeneratorSection] No nextNumbers to select');
    }
  };

  const handleCompareClick = () => {
    modals.toggleComparison();
  };

  return (
    <CollapsibleSection
      title="🎲 Number Generator"
      icon={null}
      dataSection="generator"
      titleColor={COLORS.accent.info}
      maxHeight={650}
      defaultExpanded={true}
      pinnable={true}
    >
      {/* Count input */}
      <div style={{ marginBottom: SPACING.sm }}>
        <span style={{ color: COLORS.text.secondary, fontSize: '10px' }}>
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
        <div style={{ marginBottom: SPACING.sm }}>
          <span style={{ color: COLORS.text.secondary, fontSize: '10px' }}>
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
          background: COLORS.accent.info,
          color: COLORS.text.primary,
          border: 'none',
          padding: SPACING.sm,
          borderRadius: BORDER_RADIUS.sm,
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
          background: COLORS.bg.darker,
          color: COLORS.accent.info,
          border: `1px solid ${COLORS.border.light}`,
          padding: '4px',
          borderRadius: BORDER_RADIUS.sm,
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
