// src/ui/components/modals/LivePatternAnalysisModal.jsx
// Live pattern analysis modal - real-time pattern monitoring

import { useState, useEffect, useRef } from 'preact/hooks';
import { state } from '@/games/keno/core/state.js';
import { findCommonPatterns } from '@/shared/utils/calculations/patternAlgorithms.js';
import { Button } from '@/shared/components/Button';
import { Play, Pause, X } from 'lucide-preact';
import { COLORS } from '@/shared/constants/colors.js';
import { BORDER_RADIUS, INPUT_STYLES, LABEL_STYLES } from '@/shared/constants/styles.js';

/**
 * LivePatternAnalysisModal Component
 * 
 * Displays a draggable modal that monitors patterns in real-time
 * Updates automatically when new rounds are played
 * 
 * @component
 * @param {Object} props
 * @param {boolean} props.isOpen - Whether modal is visible
 * @param {Function} props.onClose - Called when modal closes
 * @returns {preact.VNode} The rendered modal
 */
export function LivePatternAnalysisModal({ isOpen, onClose }) {
  // Settings
  const [patternSize, setPatternSize] = useState(5);
  const [sampleSize, setSampleSize] = useState(200);
  const [minHits, setMinHits] = useState(3);
  const [maxHits, setMaxHits] = useState(4);
  const [notHitIn, setNotHitIn] = useState(0);
  const [requireBuildups, setRequireBuildups] = useState(true);
  
  // State
  const [isRunning, setIsRunning] = useState(false);
  const [isComputing, setIsComputing] = useState(false);
  const [results, setResults] = useState([]);
  const [lastUpdate, setLastUpdate] = useState(Date.now());
  
  // Dragging
  const [position, setPosition] = useState({ top: '50%', left: null, right: 20, transform: 'translateY(-50%)' });
  const dragStartRef = useRef({ top: 0, left: 0 });
  const hasBeenDraggedRef = useRef(false);
  
  // Monitor for new rounds
  useEffect(() => {
    if (!isRunning) return;
    
    const handleNewRound = () => {
      updateResults();
    };
    
    window.addEventListener('kenoNewRound', handleNewRound);
    
    // Initial update
    updateResults();
    
    return () => {
      window.removeEventListener('kenoNewRound', handleNewRound);
    };
  }, [isRunning, patternSize, sampleSize, minHits, maxHits, notHitIn, requireBuildups]);
  
  const updateResults = () => {
    const history = state.currentHistory;
    if (!history || history.length === 0) {
      setResults([]);
      return;
    }
    
    setIsComputing(true);
    
    // Use setTimeout to prevent UI blocking
    setTimeout(() => {
      try {
        // Enable cache (true) for much better performance with large datasets
        const patterns = findCommonPatterns(patternSize, 20, true, sampleSize);
        
        // Filter by hit requirements
        let filtered = patterns;
        
        if (requireBuildups) {
          filtered = filtered.filter(p => {
            const hits = p.occurrences.length;
            return hits >= minHits && hits <= maxHits;
          });
        }
        
        // Filter by "not hit in" requirement
        if (notHitIn > 0) {
          filtered = filtered.filter(p => {
            // Check if pattern hasn't appeared in recent rounds
            const lastOccurrence = p.occurrences[p.occurrences.length - 1];
            const lastOccurrenceIndex = history.findIndex(r => r.time === lastOccurrence.time);
            const roundsSinceLastHit = history.length - lastOccurrenceIndex - 1;
            return roundsSinceLastHit >= notHitIn;
          });
        }
        
        setResults(filtered.slice(0, 20)); // Show top 20
        setLastUpdate(Date.now());
        setIsComputing(false);
      } catch (error) {
        console.error('[LivePattern] Error computing patterns:', error);
        setIsComputing(false);
      }
    }, 50);
  };
  
  const handleDragStart = () => {
    const modal = document.getElementById('live-pattern-overlay');
    if (!modal) return;
    
    const rect = modal.getBoundingClientRect();
    dragStartRef.current = { top: rect.top, left: rect.left };
    
    if (!hasBeenDraggedRef.current) {
      hasBeenDraggedRef.current = true;
      setPosition({ top: rect.top, left: rect.left, right: null, transform: 'none' });
    }
  };
  
  const handleDrag = (dx, dy) => {
    setPosition({
      top: dragStartRef.current.top + dy,
      left: dragStartRef.current.left + dx,
      right: null,
      transform: 'none'
    });
  };
  
  const handleStart = () => {
    setIsRunning(true);
  };
  
  const handleStop = () => {
    setIsRunning(false);
  };
  
  const handleClose = () => {
    setIsRunning(false);
    onClose();
  };

  const handleMouseDownCapture = (e) => {
    if (e.target.closest('button')) return;
    
    e.preventDefault();
    const startX = e.clientX;
    const startY = e.clientY;
    
    handleDragStart();

    const handleMouseMove = (moveEvent) => {
      const dx = moveEvent.clientX - startX;
      const dy = moveEvent.clientY - startY;
      handleDrag(dx, dy);
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };
  
  if (!isOpen) return null;
  
  return (
    <div
      id="live-pattern-overlay"
      style={{
        position: 'fixed',
        ...(position.left !== null ? { left: `${position.left}px` } : { right: `${position.right}px` }),
        top: typeof position.top === 'number' ? `${position.top}px` : position.top,
        transform: position.transform || 'none',
        width: '350px',
        maxHeight: '80vh',
        backgroundColor: COLORS.bg.darker,
        borderRadius: '12px',
        boxShadow: '0 10px 40px rgba(0,0,0,0.5)',
        zIndex: '9999999',
        fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      {/* Header */}
      <div
        onMouseDown={handleMouseDownCapture}
        style={{
          padding: '15px',
          background: COLORS.bg.dark,
          borderBottom: `2px solid ${COLORS.border.default}`,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          cursor: 'move'
        }}
      >
        <h3 style={{ margin: 0, color: COLORS.accent.info, fontSize: '16px', pointerEvents: 'none' }}>
          🔴 Live Pattern Analysis
        </h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleClose}
          icon={<X size={14} strokeWidth={2} />}
          style={{ padding: '4px' }}
        />
      </div>
      
      {/* Settings */}
      <div style={{ padding: '15px', background: COLORS.bg.dark, borderBottom: `1px solid ${COLORS.border.default}` }}>
        <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
          <div style={{ flex: 1 }}>
            <label style={{ ...LABEL_STYLES, marginBottom: '4px' }}>
              Pattern Size
            </label>
            <input
              type="number"
              value={patternSize}
              onChange={(e) => setPatternSize(parseInt(e.target.value) || 5)}
              min={2}
              max={10}
              disabled={isRunning}
              style={{
                ...INPUT_STYLES,
                width: '100%',
                fontSize: '12px'
              }}
            />
          </div>
        </div>
        
        <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
          <div style={{ flex: 1 }}>
            <label style={{ ...LABEL_STYLES, marginBottom: '4px' }}>
              Min Hits
            </label>
            <input
              type="number"
              value={minHits}
              onChange={(e) => setMinHits(parseInt(e.target.value) || 1)}
              min={1}
              max={patternSize}
              disabled={isRunning}
              style={{
                ...INPUT_STYLES,
                width: '100%',
                fontSize: '12px'
              }}
            />
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ ...LABEL_STYLES, marginBottom: '4px' }}>
              Max Hits
            </label>
            <input
              type="number"
              value={maxHits}
              onChange={(e) => setMaxHits(parseInt(e.target.value) || 1)}
              min={1}
              max={patternSize}
              disabled={isRunning}
              style={{
                ...INPUT_STYLES,
                width: '100%',
                fontSize: '12px'
              }}
            />
          </div>
        </div>
        
        <div style={{ marginBottom: '10px' }}>
          <label style={{ ...LABEL_STYLES, marginBottom: '4px' }}>
            Sample Size (fewer = faster)
          </label>
          <input
            type="number"
            value={sampleSize}
            onChange={(e) => setSampleSize(parseInt(e.target.value) || 200)}
            min={50}
            max={5000}
            disabled={isRunning}
            style={{
              ...INPUT_STYLES,
              width: '100%',
              fontSize: '12px'
            }}
          />
        </div>
        
        <div style={{ marginBottom: '10px' }}>
          <label style={{ ...LABEL_STYLES, marginBottom: '4px' }}>
            Not Hit In (0 = off)
          </label>
          <input
            type="number"
            value={notHitIn}
            onChange={(e) => setNotHitIn(parseInt(e.target.value) || 0)}
            min={0}
            max={2000}
            disabled={isRunning}
            style={{
              ...INPUT_STYLES,
              width: '100%',
              fontSize: '12px'
            }}
          />
        </div>
        
        <div style={{ marginBottom: '10px' }}>
          <label style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            color: COLORS.text.primary,
            fontSize: '12px',
            cursor: 'pointer'
          }}>
            <input
              type="checkbox"
              checked={requireBuildups}
              onChange={(e) => setRequireBuildups(e.target.checked)}
              disabled={isRunning}
              style={{ cursor: 'pointer' }}
            />
            <span style={{ userSelect: 'none' }}>Require Recent Buildups</span>
          </label>
          <div style={{ color: '#666', fontSize: '10px', marginTop: '4px', marginLeft: '26px' }}>
            Show only patterns with min/max hits in sample
          </div>
        </div>
        
        <Button
          variant={isRunning ? 'danger' : 'success'}
          size="md"
          fullWidth
          onClick={isRunning ? handleStop : handleStart}
          icon={isRunning ? <Pause size={14} strokeWidth={2} /> : <Play size={14} strokeWidth={2} />}
          iconPosition="left"
        >
          {isRunning ? 'Stop Live Analysis' : 'Start Live Analysis'}
        </Button>
      </div>
      
      {/* Status */}
      {isRunning && (
        <div style={{
          padding: '10px 15px',
          background: COLORS.bg.darkest,
          borderBottom: `1px solid ${COLORS.border.default}`,
          color: COLORS.text.secondary,
          fontSize: '11px'
        }}>
          {isComputing ? (
            <span>⏳ Computing patterns...</span>
          ) : (
            <span>Running... Last update: {new Date(lastUpdate).toLocaleTimeString()} | {results.length} patterns found</span>
          )}
        </div>
      )}
      
      {/* Results */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '15px',
        background: COLORS.bg.lighter
      }}>
        {!isRunning && (
          <div style={{ color: COLORS.text.tertiary, textAlign: 'center', padding: '40px 20px', fontSize: '12px' }}>
            Configure settings above and start analysis
          </div>
        )}
        
        {isRunning && results.length === 0 && (
          <div style={{ color: COLORS.text.tertiary, textAlign: 'center', padding: '40px 20px', fontSize: '12px' }}>
            No patterns match your criteria
          </div>
        )}
        
        {isRunning && results.map((pattern, index) => (
          <div
            key={index}
            style={{
              background: COLORS.bg.darker,
              borderRadius: BORDER_RADIUS.lg,
              padding: '12px',
              marginBottom: '10px',
              border: `1px solid ${COLORS.border.default}`
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <div style={{ color: COLORS.accent.info, fontWeight: 'bold', fontSize: '14px' }}>
                {pattern.numbers.join(', ')}
              </div>
              <div style={{ color: COLORS.accent.warning, fontSize: '12px' }}>
                {pattern.count} hits
              </div>
            </div>
            <div style={{ color: COLORS.text.secondary, fontSize: '11px' }}>
              Last seen: Bet #{pattern.occurrences[pattern.occurrences.length - 1]?.betNumber || 'N/A'}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
