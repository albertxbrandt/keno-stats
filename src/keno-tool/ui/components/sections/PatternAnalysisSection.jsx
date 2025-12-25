// src/ui/components/sections/PatternAnalysisSection.jsx
// Pattern analysis section - find recurring number combinations

import { useState } from 'preact/hooks';
import { CollapsibleSection } from '../shared/CollapsibleSection.jsx';
import { NumberInput } from '../shared/NumberInput.jsx';
import { useModals } from '@/keno-tool/hooks/useModals.js';
import { COLORS } from '@/shared/constants/colors';
import { BORDER_RADIUS, SPACING } from '@/shared/constants/styles.js';

/**
 * PatternAnalysisSection Component
 * 
 * Analyzes historical draws to find patterns of N numbers 
 * that frequently appear together
 * 
 * Features:
 * - Pattern size input (3-10)
 * - Analyze button
 * - Live analysis toggle
 * 
 * @component
 * @returns {preact.VNode} The rendered pattern analysis section
 */
export function PatternAnalysisSection() {
  const [patternSize, setPatternSize] = useState(5);
  const modals = useModals();

  const handleAnalyze = () => {
    modals.showPatternAnalysis(patternSize);
  };

  const handleLiveToggle = () => {
    modals.showLivePatternAnalysis();
  };

  return (
    <CollapsibleSection
      icon="🔍"
      title="Pattern Analysis"
      defaultExpanded={false}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {/* Pattern Size Input and Analyze Button */}
        <div style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
          <span style={{ color: COLORS.text.secondary, fontSize: '11px', whiteSpace: 'nowrap' }}>
            Size:
          </span>
          <NumberInput
            value={patternSize}
            onChange={setPatternSize}
            min={3}
            max={10}
            placeholder="3-10"
            style={{ flex: 1 }}
          />
          <button
            onClick={handleAnalyze}
            style={{
              flex: 1,
              background: COLORS.accent.warning,
              color: '#222',
              border: 'none',
              padding: SPACING.inputPadding,
              borderRadius: BORDER_RADIUS.sm,
              fontWeight: 'bold',
              cursor: 'pointer',
              fontSize: '11px',
              transition: 'opacity 0.2s'
            }}
            onMouseEnter={(e) => e.target.style.opacity = '0.9'}
            onMouseLeave={(e) => e.target.style.opacity = '1'}
          >
            Analyze
          </button>
        </div>

        {/* Live Analysis Toggle Button */}
        <button
          onClick={handleLiveToggle}
          style={{
            width: '100%',
            background: COLORS.accent.success,
            color: COLORS.text.primary,
            border: 'none',
            padding: SPACING.sm,
            borderRadius: BORDER_RADIUS.sm,
            fontWeight: 'bold',
            cursor: 'pointer',
            fontSize: '11px',
            transition: 'background 0.2s',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px'
          }}
          onMouseEnter={(e) => e.target.style.background = '#059669'}
          onMouseLeave={(e) => e.target.style.background = COLORS.accent.success}
        >
          <span style={{ fontSize: '14px' }}>🔴</span>
          Start Live Analysis
        </button>

        {/* Info Text */}
        <div style={{
          color: COLORS.text.tertiary,
          fontSize: '9px',
          lineHeight: '1.3',
          padding: '4px',
          background: COLORS.bg.darkest,
          borderRadius: BORDER_RADIUS.sm
        }}>
          Find patterns of {patternSize} numbers appearing together in drawn results
        </div>
      </div>
    </CollapsibleSection>
  );
}
