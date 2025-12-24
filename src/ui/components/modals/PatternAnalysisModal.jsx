import { h } from 'preact';
import { useState } from 'preact/hooks';
import { Modal } from '../shared/Modal.jsx';
import { state } from '../../../core/state.js';

/**
 * Pattern card component displaying a single pattern result
 */
function PatternCard({ pattern, index, onSelect, onSave }) {
  const [showOccurrences, setShowOccurrences] = useState(false);
  const percentage = ((pattern.count / state.currentHistory.length) * 100).toFixed(1);
  const lastOccurrence = pattern.occurrences[pattern.occurrences.length - 1];
  const lastBetNumber = lastOccurrence.betNumber;
  const betsAgo = state.currentHistory.length - lastBetNumber;

  const handleSave = (e) => {
    e.stopPropagation();
    onSave(pattern.numbers, index);
  };

  return (
    <div
      style={{
        background: '#0f212e',
        padding: '12px 15px',
        borderRadius: '8px',
        borderLeft: `3px solid ${index < 3 ? '#00b894' : '#74b9ff'}`
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '8px'
        }}
      >
        <div
          onClick={() => onSelect(pattern.numbers)}
          style={{ flex: 1, cursor: 'pointer' }}
          title="Click to select these numbers"
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}
          >
            <div style={{ flex: 1 }}>
              <span style={{ color: '#aaa', fontSize: '11px', marginRight: '8px' }}>
                #{index + 1}
              </span>
              <span style={{ color: '#fff', fontWeight: 'bold', fontSize: '15px' }}>
                {pattern.numbers.join(', ')}
              </span>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ color: '#00b894', fontWeight: 'bold', fontSize: '16px' }}>
                {pattern.count}×
              </div>
              <div style={{ color: '#888', fontSize: '11px' }}>{percentage}%</div>
            </div>
          </div>
        </div>
        <button
          onClick={handleSave}
          style={{
            marginLeft: '10px',
            padding: '6px 12px',
            background: '#2a3b4a',
            color: '#74b9ff',
            border: 'none',
            borderRadius: '4px',
            fontSize: '11px',
            cursor: 'pointer',
            whiteSpace: 'nowrap'
          }}
          title="Save this pattern"
        >
          💾 Save
        </button>
      </div>

      {/* Last seen and occurrences dropdown */}
      <div
        style={{
          marginTop: '8px',
          paddingTop: '8px',
          borderTop: '1px solid #1a2c38'
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            cursor: 'pointer'
          }}
          onClick={() => setShowOccurrences(!showOccurrences)}
        >
          <span style={{ color: '#aaa', fontSize: '11px' }}>
            Last seen: Bet #{lastBetNumber} ({betsAgo} bet{betsAgo !== 1 ? 's' : ''} ago)
          </span>
          <span style={{ color: '#74b9ff', fontSize: '11px' }}>
            {showOccurrences ? '▲' : '▼'} View all ({pattern.count})
          </span>
        </div>

        {showOccurrences && (
          <div
            style={{
              marginTop: '8px',
              maxHeight: '150px',
              overflowY: 'auto',
              background: '#14202b',
              borderRadius: '4px',
              padding: '6px'
            }}
          >
            {pattern.occurrences
              .slice()
              .reverse()
              .map((occurrence) => {
                const occTime = new Date(occurrence.time).toLocaleString();
                return (
                  <div
                    key={occurrence.betNumber}
                    style={{
                      padding: '4px',
                      borderBottom: '1px solid #1a2c38',
                      fontSize: '10px'
                    }}
                  >
                    <span style={{ color: '#00b894' }}>Bet #{occurrence.betNumber}</span>
                    <span style={{ color: '#666', marginLeft: '8px' }}>{occTime}</span>
                  </div>
                );
              })}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Pattern analysis modal component
 */
export function PatternAnalysisModal({
  patternSize,
  patterns,
  stats,
  sortBy = 'frequency',
  sampleSize = 0,
  onClose,
  onRefresh,
  onSelectNumbers,
  onSavePattern
}) {
  const [savedStates, setSavedStates] = useState({});
  const [localSortBy, setLocalSortBy] = useState(sortBy);
  const [localSampleSize, setLocalSampleSize] = useState(sampleSize);

  const totalHistory = state.currentHistory.length;
  const analyzedCount = sampleSize > 0 ? Math.min(sampleSize, totalHistory) : totalHistory;

  const handleRefresh = () => {
    onRefresh(localSortBy, localSampleSize);
  };

  const handleSavePattern = (numbers, index) => {
    const name = prompt('Enter a name for this combination (optional):') || '';
    onSavePattern(numbers, name).then(() => {
      setSavedStates({ ...savedStates, [index]: true });
      setTimeout(() => {
        setSavedStates((prev) => ({ ...prev, [index]: false }));
      }, 1500);
    });
  };

  // Header extra content (filters)
  const headerExtra = (
    <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-end' }}>
      <div>
        <label
          style={{
            color: '#888',
            fontSize: '10px',
            display: 'block',
            marginBottom: '4px'
          }}
        >
          Sort
        </label>
        <select
          value={localSortBy}
          onChange={(e) => setLocalSortBy(e.target.value)}
          style={{
            padding: '6px 8px',
            background: '#0f212e',
            color: '#fff',
            border: '1px solid #333',
            borderRadius: '4px',
            fontSize: '11px',
            cursor: 'pointer'
          }}
        >
          <option value="frequency">Most Frequent</option>
          <option value="recent">Recently Hit</option>
          <option value="hot">Hot (Clustered)</option>
        </select>
      </div>
      <div>
        <label
          style={{
            color: '#888',
            fontSize: '10px',
            display: 'block',
            marginBottom: '4px'
          }}
        >
          Sample
        </label>
        <input
          type="number"
          min="0"
          max={totalHistory}
          value={localSampleSize}
          onChange={(e) => setLocalSampleSize(parseInt(e.target.value) || 0)}
          placeholder="All"
          style={{
            width: '60px',
            padding: '6px 8px',
            background: '#0f212e',
            color: '#fff',
            border: '1px solid #333',
            borderRadius: '4px',
            fontSize: '11px',
            textAlign: 'center'
          }}
        />
      </div>
      <button
        onClick={handleRefresh}
        style={{
          padding: '6px 12px',
          background: '#2a3b4a',
          color: '#74b9ff',
          border: 'none',
          borderRadius: '4px',
          fontSize: '11px',
          fontWeight: 'bold',
          cursor: 'pointer',
          whiteSpace: 'nowrap'
        }}
      >
        Apply
      </button>
    </div>
  );

  return (
    <Modal
      title={`Pattern Analysis: ${patternSize} Numbers`}
      icon="🔍"
      onClose={onClose}
      headerExtra={headerExtra}
      defaultPosition={{ x: window.innerWidth / 2 - 300, y: 50 }}
      defaultSize={{ width: 600, height: 'auto' }}
      zIndex={1000000}
    >
      {/* Stats summary */}
      <div
        style={{
          background: '#0f212e',
          padding: '15px',
          borderRadius: '8px',
          marginBottom: '20px'
        }}
      >
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
          <div>
            <div style={{ color: '#aaa', fontSize: '12px', marginBottom: '5px' }}>
              Total Patterns Found
            </div>
            <div style={{ color: '#00b894', fontSize: '22px', fontWeight: 'bold' }}>
              {stats.totalCombinations}
            </div>
          </div>
          <div>
            <div style={{ color: '#aaa', fontSize: '12px', marginBottom: '5px' }}>
              Avg Appearances
            </div>
            <div style={{ color: '#74b9ff', fontSize: '22px', fontWeight: 'bold' }}>
              {stats.avgAppearance}
            </div>
          </div>
        </div>
        <div style={{ color: '#666', fontSize: '11px', marginTop: '10px' }}>
          Analyzed {analyzedCount} of {totalHistory} rounds
        </div>
      </div>

      {/* Header */}
      <div style={{ marginBottom: '15px' }}>
        <h3 style={{ color: '#74b9ff', fontSize: '16px', margin: '0 0 15px 0' }}>
          Top {patterns.length} Most Common Patterns
        </h3>
        <div style={{ color: '#888', fontSize: '12px', marginBottom: '10px' }}>
          These {patternSize}-number combinations appeared together most frequently:
        </div>
      </div>

      {/* Pattern cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
        {patterns.map((pattern, index) => (
          <PatternCard
            key={index}
            pattern={pattern}
            index={index}
            onSelect={onSelectNumbers}
            onSave={handleSavePattern}
          />
        ))}
      </div>

      {/* Note */}
      <div
        style={{
          padding: '12px',
          background: '#0f212e',
          borderRadius: '6px',
          borderLeft: '3px solid #fdcb6e'
        }}
      >
        <div style={{ color: '#666', fontSize: '11px', lineHeight: '1.5' }}>
          <strong style={{ color: '#888' }}>Note:</strong> Patterns show which {patternSize}
          -number combinations appeared together most frequently in drawn numbers. This is for
          analysis only and does not predict future outcomes.
        </div>
      </div>
    </Modal>
  );
}
