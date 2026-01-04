// src/ui/components/sections/GeneratorSection.jsx
// Main generator section that composes all generator sub-components
// Handles method-specific parameter visibility and number selection

import { useState, useEffect, useRef } from 'preact/hooks';
import { state } from '@/games/keno/core/state.js';
import { CollapsibleSection } from '@/shared/components/CollapsibleSection.jsx';
import { initButtonPreviewHighlight } from '@/games/keno/ui/previewHighlight.js';
import { NumberInput } from '@/shared/components/NumberInput.jsx';
import { Button } from '@/shared/components/Button.jsx';
import { GeneratorPreview } from '../generator/GeneratorPreview.jsx';
import { MethodSelector } from '../generator/MethodSelector.jsx';
import { AutoRefreshControl } from '../generator/AutoRefreshControl.jsx';
import { ShapesParams } from '../generator/ShapesParams.jsx';
import { MomentumParams } from '../generator/MomentumParams.jsx';
import { saveGeneratorSettings } from '@/games/keno/core/storage.js';
import { generateNumbers, selectPredictedNumbers } from '@/games/keno/ui/numberSelection.js';
import { useModals } from '@/games/keno/hooks/useModals.js';
import { COLORS } from '@/shared/constants/colors.js';
import { SPACING } from '@/shared/constants/styles.js';
import { Dices, BarChart3 } from 'lucide-preact';

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
  const selectButtonRef = useRef(null);

  // Determine which method uses which params
  const showShapesParams = selectedMethod === 'shapes';
  const showMomentumParams = selectedMethod === 'momentum';

  // Sync with global state on mount
  useEffect(() => {
    setCount(state.generatorCount || 3);
    setSampleSize(state.generatorSampleSize || 20);
    setSelectedMethod(state.generatorMethod || 'frequency');
  }, []);

  // Initialize preview highlight on Select button
  useEffect(() => {
    if (selectButtonRef.current) {
      initButtonPreviewHighlight(selectButtonRef.current);
    }
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
    // Apply preview numbers and generate new ones
    if (state.nextNumbers && state.nextNumbers.length > 0) {
      state.generatedNumbers = state.nextNumbers;
      await selectPredictedNumbers();
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
      title="Number Generator"
      icon={<Dices size={14} strokeWidth={2} />}
      dataSection="generator"
      maxHeight="none"
      defaultExpanded={true}
      pinnable={true}
    >
      {/* Count and Sample Size - side by side */}
      <div style={{ 
        display: 'flex', 
        gap: SPACING.sm, 
        marginBottom: SPACING.sm 
      }}>
        {/* Count input */}
        <div style={{ flex: 1 }}>
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

        {/* Sample size input (universal - used by all generators) */}
        <div style={{ flex: 1 }}>
          <span style={{ color: COLORS.text.secondary, fontSize: '10px' }}>
            Sample Size:
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
      </div>

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
      <div ref={selectButtonRef}>
        <Button
          variant="primary"
          size="md"
          fullWidth
          onClick={handleSelectClick}
          id="generate-numbers-btn"
        >
          Select
        </Button>
      </div>

      <Button
        variant="ghost"
        size="sm"
        fullWidth
        onClick={handleCompareClick}
        icon={<BarChart3 size={12} strokeWidth={2} />}
        iconPosition="left"
        style={{ marginTop: '4px' }}
      >
        Compare Methods
      </Button>
    </CollapsibleSection>
  );
}
