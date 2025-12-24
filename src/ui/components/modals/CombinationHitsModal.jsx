import { h } from 'preact';
import { useState } from 'preact/hooks';
import { Modal } from '../shared/Modal.jsx';
import { PayoutGraph } from '../PayoutGraph.jsx';
import { state } from '../../../core/state.js';

/**
 * Hit occurrence card component
 */
function HitCard({ hit, totalBets }) {
  const betNumber = hit.historyIndex + 1;
  const betsAgo = totalBets - betNumber;
  const timeStr = new Date(hit.time).toLocaleString();

  return (
    <div
      style={{
        background: '#0f212e',
        padding: '10px 12px',
        borderRadius: '6px',
        borderLeft: '3px solid #00b894'
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '4px'
        }}
      >
        <span style={{ color: '#00b894', fontWeight: 'bold', fontSize: '12px' }}>
          Bet #{betNumber}
        </span>
        <span style={{ color: '#888', fontSize: '10px' }}>
          {betsAgo} bet{betsAgo !== 1 ? 's' : ''} ago
        </span>
      </div>
      <div style={{ color: '#666', fontSize: '10px' }}>{timeStr}</div>
    </div>
  );
}

/**
 * Combination hits modal component
 */
export function CombinationHitsModal({
  numbers,
  comboName,
  hits,
  betMultipliers,
  onClose,
  onRiskModeChange,
  onLookbackChange,
  initialRiskMode = 'high',
  initialLookback = 50
}) {
  const [riskMode, setRiskMode] = useState(initialRiskMode);
  const [lookback, setLookback] = useState(initialLookback);

  const totalBets = state.currentHistory.length;
  const hitRate = totalBets > 0 ? ((hits.length / totalBets) * 100).toFixed(1) : '0.0';

  const handleRiskModeChange = (e) => {
    const newMode = e.target.value;
    setRiskMode(newMode);
    onRiskModeChange(newMode);
  };

  const handleLookbackChange = (e) => {
    const value = parseInt(e.target.value) || 50;
    const min = parseInt(e.target.min);
    const max = parseInt(e.target.max);
    const clampedValue = Math.min(Math.max(value, min), max);
    setLookback(clampedValue);
    onLookbackChange(clampedValue);
  };

  // Header extra content (graph controls)
  const headerExtra = (
    <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end' }}>
      <div>
        <label
          style={{
            color: '#888',
            fontSize: '10px',
            display: 'block',
            marginBottom: '4px'
          }}
        >
          Risk
        </label>
        <select
          value={riskMode}
          onChange={handleRiskModeChange}
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
          <option value="classic">Classic</option>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
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
          Lookback
        </label>
        <input
          type="number"
          min="10"
          max={totalBets}
          value={lookback}
          onChange={handleLookbackChange}
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
    </div>
  );

  return (
    <Modal
      title="Combination Stats"
      icon="📊"
      onClose={onClose}
      headerExtra={headerExtra}
      defaultPosition={{ x: window.innerWidth / 2 - 250, y: 50 }}
      defaultSize={{ width: 500, height: 'auto' }}
      zIndex={1000001}
    >
      {/* Combination summary */}
      <div
        style={{
          background: '#0f212e',
          padding: '15px',
          borderRadius: '8px',
          marginBottom: '15px',
          borderLeft: '3px solid #00b894'
        }}
      >
        <div
          style={{
            color: '#fff',
            fontSize: '15px',
            fontWeight: 'bold',
            marginBottom: '8px'
          }}
        >
          {numbers.join(', ')}
        </div>
        <div style={{ color: '#888', fontSize: '12px', marginBottom: '12px' }}>
          {comboName}
        </div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            paddingTop: '10px',
            borderTop: '1px solid #1a2c38'
          }}
        >
          <div>
            <div style={{ color: '#00b894', fontSize: '20px', fontWeight: 'bold' }}>
              {hits.length}
            </div>
            <div style={{ color: '#666', fontSize: '10px' }}>Complete Hits</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ color: '#74b9ff', fontSize: '20px', fontWeight: 'bold' }}>
              {hitRate}%
            </div>
            <div style={{ color: '#666', fontSize: '10px' }}>Hit Rate</div>
          </div>
        </div>
      </div>

      {/* Payout graph */}
      {betMultipliers && (
        <PayoutGraph
          numbers={numbers}
          history={state.currentHistory}
          betMultipliers={betMultipliers}
          riskMode={riskMode}
          lookback={lookback}
        />
      )}

      {/* Hit occurrences */}
      {hits.length === 0 ? (
        <div
          style={{
            color: '#666',
            textAlign: 'center',
            padding: '30px 20px',
            background: '#0f212e',
            borderRadius: '8px'
          }}
        >
          This combination has never hit all numbers in your bet history.
        </div>
      ) : (
        <>
          <div style={{ marginBottom: '10px' }}>
            <h3 style={{ color: '#74b9ff', fontSize: '14px', margin: '0 0 10px 0' }}>
              All Occurrences ({hits.length})
            </h3>
          </div>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              maxHeight: '300px',
              overflowY: 'auto'
            }}
          >
            {hits
              .slice()
              .sort((a, b) => b.historyIndex - a.historyIndex)
              .map((hit, index) => (
                <HitCard key={index} hit={hit} totalBets={totalBets} />
              ))}
          </div>
        </>
      )}

      {/* Note */}
      <div
        style={{
          marginTop: '20px',
          paddingTop: '15px',
          borderTop: '1px solid #333'
        }}
      >
        <div style={{ color: '#666', fontSize: '11px', lineHeight: '1.5' }}>
          <strong style={{ color: '#888' }}>Note:</strong> Shows all bets where every number in
          this combination appeared in the drawn numbers.
        </div>
      </div>
    </Modal>
  );
}
