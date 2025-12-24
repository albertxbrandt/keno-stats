// src/ui/components/modals/LivePatternAnalysisModal.jsx
// Live pattern analysis modal - real-time pattern monitoring

import { useState, useEffect, useRef } from 'preact/hooks';
import { state } from '../../../core/state.js';
import { findCommonPatterns } from '../../../utils/calculations/patternAlgorithms.js';

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
  const [sampleSize, setSampleSize] = useState(100);
  const [minHits, setMinHits] = useState(3);
  const [maxHits, setMaxHits] = useState(4);
  const [notHitIn, setNotHitIn] = useState(0);
  const [requireBuildups, setRequireBuildups] = useState(true);
  
  // State
  const [isRunning, setIsRunning] = useState(false);
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
    
    // Find patterns from sample size
    const patterns = findCommonPatterns(patternSize, 50, false); // Get top 50
    
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
        backgroundColor: '#1a2c38',
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
          background: '#0f212e',
          borderBottom: '2px solid #2a3b4a',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          cursor: 'move'
        }}
      >
        <h3 style={{ margin: 0, color: '#74b9ff', fontSize: '16px', pointerEvents: 'none' }}>
          🔴 Live Pattern Analysis
        </h3>
        <button
          onClick={handleClose}
          style={{
            background: 'none',
            border: 'none',
            color: '#fff',
            fontSize: '20px',
            cursor: 'pointer',
            padding: 0,
            width: '24px',
            height: '24px'
          }}
        >
          ✕
        </button>
      </div>
      
      {/* Settings */}
      <div style={{ padding: '15px', background: '#0f212e', borderBottom: '1px solid #2a3b4a' }}>
        <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
          <div style={{ flex: 1 }}>
            <label style={{ color: '#888', fontSize: '11px', display: 'block', marginBottom: '4px' }}>
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
                width: '100%',
                background: '#1a2c38',
                color: '#fff',
                border: '1px solid #2a3b4a',
                borderRadius: '4px',
                padding: '6px 8px',
                fontSize: '12px'
              }}
            />
          </div>
        </div>
        
        <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
          <div style={{ flex: 1 }}>
            <label style={{ color: '#888', fontSize: '11px', display: 'block', marginBottom: '4px' }}>
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
                width: '100%',
                background: '#1a2c38',
                color: '#fff',
                border: '1px solid #2a3b4a',
                borderRadius: '4px',
                padding: '6px 8px',
                fontSize: '12px'
              }}
            />
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ color: '#888', fontSize: '11px', display: 'block', marginBottom: '4px' }}>
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
                width: '100%',
                background: '#1a2c38',
                color: '#fff',
                border: '1px solid #2a3b4a',
                borderRadius: '4px',
                padding: '6px 8px',
                fontSize: '12px'
              }}
            />
          </div>
        </div>
        
        <div style={{ marginBottom: '10px' }}>
          <label style={{ color: '#888', fontSize: '11px', display: 'block', marginBottom: '4px' }}>
            Sample Size
          </label>
          <input
            type="number"
            value={sampleSize}
            onChange={(e) => setSampleSize(parseInt(e.target.value) || 100)}
            min={1}
            max={1000}
            disabled={isRunning}
            style={{
              width: '100%',
              background: '#1a2c38',
              color: '#fff',
              border: '1px solid #2a3b4a',
              borderRadius: '4px',
              padding: '6px 8px',
              fontSize: '12px'
            }}
          />
        </div>
        
        <div style={{ marginBottom: '10px' }}>
          <label style={{ color: '#888', fontSize: '11px', display: 'block', marginBottom: '4px' }}>
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
              width: '100%',
              background: '#1a2c38',
              color: '#fff',
              border: '1px solid #2a3b4a',
              borderRadius: '4px',
              padding: '6px 8px',
              fontSize: '12px'
            }}
          />
        </div>
        
        <div style={{ marginBottom: '10px' }}>
          <label style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            color: '#fff',
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
        
        <button
          onClick={isRunning ? handleStop : handleStart}
          style={{
            width: '100%',
            background: isRunning ? '#f87171' : '#00b894',
            color: '#fff',
            border: 'none',
            padding: '8px',
            borderRadius: '4px',
            fontWeight: 'bold',
            cursor: 'pointer',
            fontSize: '12px'
          }}
        >
          {isRunning ? '⏸ Stop Live Analysis' : '▶ Start Live Analysis'}
        </button>
      </div>
      
      {/* Status */}
      {isRunning && (
        <div style={{
          padding: '10px 15px',
          background: '#0a1620',
          borderBottom: '1px solid #2a3b4a',
          color: '#888',
          fontSize: '11px'
        }}>
          Running... Last update: {new Date(lastUpdate).toLocaleTimeString()} | {results.length} patterns found
        </div>
      )}
      
      {/* Results */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '15px',
        background: '#213743'
      }}>
        {!isRunning && (
          <div style={{ color: '#666', textAlign: 'center', padding: '40px 20px', fontSize: '12px' }}>
            Configure settings above and start analysis
          </div>
        )}
        
        {isRunning && results.length === 0 && (
          <div style={{ color: '#666', textAlign: 'center', padding: '40px 20px', fontSize: '12px' }}>
            No patterns match your criteria
          </div>
        )}
        
        {isRunning && results.map((pattern, index) => (
          <div
            key={index}
            style={{
              background: '#1a2c38',
              borderRadius: '8px',
              padding: '12px',
              marginBottom: '10px',
              border: '1px solid #2a3b4a'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <div style={{ color: '#74b9ff', fontWeight: 'bold', fontSize: '14px' }}>
                {pattern.pattern.join(', ')}
              </div>
              <div style={{ color: '#ffd700', fontSize: '12px' }}>
                {pattern.occurrences.length} hits
              </div>
            </div>
            <div style={{ color: '#aaa', fontSize: '11px' }}>
              Last seen: Bet #{pattern.occurrences[pattern.occurrences.length - 1]?.betNumber || 'N/A'}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  function handleMouseDownCapture(e) {
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
  }
}
