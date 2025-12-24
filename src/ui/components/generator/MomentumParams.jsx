// src/ui/components/generator/MomentumParams.jsx
// Configuration panel for Momentum generator method
// Advanced parameters for momentum detection algorithm

import { useState, useEffect } from 'preact/hooks';
import { state } from '../../../core/state.js';
import { stateEvents, EVENTS } from '../../../core/stateEvents.js';
import { saveGeneratorSettings } from '../../../core/storage.js';
import { NumberInput } from '../shared/NumberInput.jsx';
import { COLORS } from '../../constants/colors.js';
import { BORDER_RADIUS } from '../../constants/styles.js';

/**
 * MomentumParams Component
 * 
 * Parameters specific to the Momentum generator method:
 * - Current numbers display: Shows currently detected momentum numbers
 * - Advanced settings toggle: Collapsible section for fine-tuning
 * - Detection window: How many recent rounds to analyze
 * - Baseline window: Historical baseline comparison period
 * - Threshold: Minimum momentum ratio to qualify
 * - Pool size: How many candidates to consider
 * 
 * Only displayed when generator method is set to 'momentum'.
 * 
 * @component
 * @returns {preact.VNode} Momentum configuration panel
 * 
 * @example
 * <MomentumParams />
 */
export function MomentumParams() {
  const [currentNumbers, setCurrentNumbers] = useState('-');
  const [advancedExpanded, setAdvancedExpanded] = useState(false);
  
  // Advanced parameters
  const [detectionWindow, setDetectionWindow] = useState(state.momentumDetectionWindow || 20);
  const [baselineWindow, setBaselineWindow] = useState(state.momentumBaselineGames || 80);
  const [threshold, setThreshold] = useState(state.momentumThreshold || 1.5);
  const [poolSize, setPoolSize] = useState(state.momentumPoolSize || 15);

  // Sync with global state on mount and when generator updates
  useEffect(() => {
    const updateFromState = () => {
      setDetectionWindow(state.momentumDetectionWindow || 20);
      setBaselineWindow(state.momentumBaselineGames || 80);
      setThreshold(state.momentumThreshold || 1.5);
      setPoolSize(state.momentumPoolSize || 15);
      updateCurrentNumbers();
    };

    // Initial update
    updateFromState();

    // Subscribe to state change events
    const unsubGenerator = stateEvents.on(EVENTS.GENERATOR_UPDATED, updateCurrentNumbers);
    const unsubSettings = stateEvents.on(EVENTS.SETTINGS_CHANGED, updateFromState);

    return () => {
      unsubGenerator();
      unsubSettings();
    };
  }, []);

  const updateCurrentNumbers = () => {
    const nums = state.momentumCurrentNumbers;
    if (nums && nums.length > 0) {
      setCurrentNumbers(nums.join(', '));
    } else {
      setCurrentNumbers('-');
    }
  };

  const handleDetectionChange = (value) => {
    setDetectionWindow(value);
    state.momentumDetectionWindow = value;
    saveGeneratorSettings();
  };

  const handleBaselineChange = (value) => {
    setBaselineWindow(value);
    state.momentumBaselineGames = value;
    saveGeneratorSettings();
  };

  const handleThresholdChange = (value) => {
    setThreshold(value);
    state.momentumThreshold = value;
    saveGeneratorSettings();
  };

  const handlePoolChange = (value) => {
    setPoolSize(value);
    state.momentumPoolSize = value;
    saveGeneratorSettings();
  };

  const handleReset = () => {
    const defaults = {
      detection: 20,
      baseline: 80,
      threshold: 1.5,
      pool: 15
    };

    setDetectionWindow(defaults.detection);
    setBaselineWindow(defaults.baseline);
    setThreshold(defaults.threshold);
    setPoolSize(defaults.pool);

    state.momentumDetectionWindow = defaults.detection;
    state.momentumBaselineGames = defaults.baseline;
    state.momentumThreshold = defaults.threshold;
    state.momentumPoolSize = defaults.pool;

    saveGeneratorSettings();
  };

  return (
    <div style={{ marginBottom: '8px' }}>
      {/* Current numbers display */}
      <div style={{
        marginBottom: '6px',
        padding: '6px',
        background: COLORS.bg.darkest,
        borderRadius: BORDER_RADIUS.sm
      }}>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '2px'
        }}>
          <span style={{ color: COLORS.text.tertiary, fontSize: '9px' }}>
            Current Numbers:
          </span>
          <span style={{
            color: COLORS.accent.info,
            fontSize: '8px',
            fontWeight: '500',
            lineHeight: '1.3',
            wordBreak: 'break-all'
          }}>
            {currentNumbers}
          </span>
        </div>
      </div>

      {/* Advanced settings toggle */}
      <div
        onClick={() => setAdvancedExpanded(!advancedExpanded)}
        style={{
          marginBottom: '6px',
          cursor: 'pointer',
          padding: '4px',
          background: COLORS.bg.darkest,
          borderRadius: BORDER_RADIUS.sm,
          border: `1px solid ${COLORS.border.light}`
        }}
      >
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <span style={{
            color: COLORS.accent.info,
            fontSize: '9px',
            fontWeight: '600'
          }}>
            ⚙️ Advanced Settings
          </span>
          <span style={{
            color: COLORS.accent.info,
            fontSize: '10px',
            transform: advancedExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
            transition: 'transform 0.3s ease'
          }}>
            ▶
          </span>
        </div>
      </div>

      {/* Advanced content */}
      <div style={{
        maxHeight: advancedExpanded ? '300px' : '0',
        overflow: 'hidden',
        transition: 'max-height 0.3s ease, opacity 0.3s ease',
        opacity: advancedExpanded ? '1' : '0'
      }}>
        <div style={{
          padding: '4px',
          background: '#0a1a24',
          borderRadius: '4px',
          marginBottom: '6px'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '6px'
          }}>
            <span style={{ color: COLORS.text.tertiary, fontSize: '8px' }}>
              Uses Sample Size × 4 for baseline
            </span>
            <button
              onClick={handleReset}
              style={{
                background: COLORS.bg.darker,
                color: COLORS.accent.info,
                border: `1px solid ${COLORS.border.light}`,
                padding: '2px 6px',
                borderRadius: '3px',
                cursor: 'pointer',
                fontSize: '8px'
              }}
            >
              Reset
            </button>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '6px',
            marginBottom: '6px'
          }}>
            <div>
              <span style={{ color: COLORS.text.secondary, fontSize: '9px' }}>
                Detection:
              </span>
              <NumberInput
                value={detectionWindow}
                onChange={handleDetectionChange}
                min={3}
                max={50}
                step={1}
                width="100%"
              />
            </div>
            <div>
              <span style={{ color: '#aaa', fontSize: '9px' }}>
                Baseline:
              </span>
              <NumberInput
                value={baselineWindow}
                onChange={handleBaselineChange}
                min={10}
                max={200}
                step={1}
                width="100%"
              />
            </div>
            <div>
              <span style={{ color: '#aaa', fontSize: '9px' }}>
                Threshold:
              </span>
              <NumberInput
                value={threshold}
                onChange={handleThresholdChange}
                min={1}
                max={3}
                step={0.1}
                width="100%"
              />
            </div>
            <div>
              <span style={{ color: '#aaa', fontSize: '9px' }}>
                Pool:
              </span>
              <NumberInput
                value={poolSize}
                onChange={handlePoolChange}
                min={5}
                max={30}
                step={1}
                width="100%"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
