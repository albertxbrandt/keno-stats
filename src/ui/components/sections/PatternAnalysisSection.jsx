// src/ui/components/sections/PatternAnalysisSection.jsx
// Pattern analysis section - find recurring number combinations

import { useState } from 'preact/hooks';
// eslint-disable-next-line no-unused-vars
import { CollapsibleSection } from '../shared/CollapsibleSection.jsx';
// eslint-disable-next-line no-unused-vars
import { NumberInput } from '../shared/NumberInput.jsx';

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
  const [isLiveAnalysisActive, setIsLiveAnalysisActive] = useState(false);

  const handleAnalyze = () => {
    if (window.__keno_showPatternAnalysisModal) {
      window.__keno_showPatternAnalysisModal(patternSize);
    }
  };

  const handleLiveToggle = () => {
    const newState = !isLiveAnalysisActive;
    setIsLiveAnalysisActive(newState);
    
    if (window.__keno_toggleLivePatternAnalysis) {
      window.__keno_toggleLivePatternAnalysis(newState, patternSize);
    }
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
          <span style={{ color: '#aaa', fontSize: '11px', whiteSpace: 'nowrap' }}>
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
              background: '#ffd700',
              color: '#222',
              border: 'none',
              padding: '6px 8px',
              borderRadius: '4px',
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
            background: isLiveAnalysisActive ? '#f87171' : '#00b894',
            color: '#fff',
            border: 'none',
            padding: '8px',
            borderRadius: '4px',
            fontWeight: 'bold',
            cursor: 'pointer',
            fontSize: '11px',
            transition: 'background 0.2s',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px'
          }}
          onMouseEnter={(e) => {
            e.target.style.background = isLiveAnalysisActive ? '#dc2626' : '#059669';
          }}
          onMouseLeave={(e) => {
            e.target.style.background = isLiveAnalysisActive ? '#f87171' : '#00b894';
          }}
        >
          <span style={{ fontSize: '14px' }}>
            {isLiveAnalysisActive ? '⏸' : '▶'}
          </span>
          {isLiveAnalysisActive ? 'Stop Live Analysis' : 'Start Live Analysis'}
        </button>

        {/* Info Text */}
        <div style={{
          color: '#666',
          fontSize: '9px',
          lineHeight: '1.3',
          padding: '4px',
          background: '#14202b',
          borderRadius: '4px'
        }}>
          Find patterns of {patternSize} numbers appearing together in drawn results
        </div>
      </div>
    </CollapsibleSection>
  );
}
