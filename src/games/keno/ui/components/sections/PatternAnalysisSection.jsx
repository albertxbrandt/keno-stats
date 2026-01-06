// src/ui/components/sections/PatternAnalysisSection.jsx
// Pattern analysis section - find recurring number combinations

import { useState } from 'preact/hooks';
import { CollapsibleSection } from '@/shared/components/CollapsibleSection';
import { Search, Radio } from 'lucide-preact';
import { NumberInput } from '@/shared/components/NumberInput';
import { Button } from '@/shared/components/Button';
import { useModals } from '@/games/keno/hooks/useModals.js';
import { COLORS } from '@/shared/constants/colors.js';
import { BORDER_RADIUS, FONT_SIZES } from '@/shared/constants/styles.js';

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
      icon={<Search size={14} strokeWidth={2} />}
      title="Pattern Analysis"
      defaultExpanded={false}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {/* Pattern Size Input and Analyze Button */}
        <div style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
          <span style={{ color: COLORS.text.secondary, fontSize: FONT_SIZES.sm, whiteSpace: 'nowrap' }}>
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
          <div style={{ flex: 1 }}>
            <Button
              variant="warning"
              size="sm"
              fullWidth
              onClick={handleAnalyze}
            >
              Analyze
            </Button>
          </div>
        </div>

        {/* Live Analysis Toggle Button */}
        <Button
          variant="success"
          size="sm"
          fullWidth
          onClick={handleLiveToggle}
          icon={<Radio size={12} strokeWidth={2} />}
          iconPosition="left"
        >
          Start Live Analysis
        </Button>

        {/* Info Text */}
        <div style={{
          color: COLORS.text.tertiary,
          fontSize: FONT_SIZES.xs,
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
