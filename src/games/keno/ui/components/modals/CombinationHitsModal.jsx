import { h } from 'preact';
import { useState } from 'preact/hooks';
import { Modal } from '@/shared/components/Modal';
import { BarChart3 } from 'lucide-preact';
import { PayoutGraph } from '../PayoutGraph.jsx';
import { ProfitLossGraph } from '../ProfitLossGraph.jsx';
import { state } from '@/games/keno/core/state.js';
import { saveGraphPreferences } from '@/shared/storage/savedNumbers.js';
import { COLORS } from '@/shared/constants/colors.js';
import { BORDER_RADIUS, INPUT_STYLES, LABEL_STYLES } from '@/shared/constants/styles.js';
import { DEFAULTS } from '@/shared/constants/defaults.js';

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
        background: COLORS.bg.dark,
        padding: '10px 12px',
        borderRadius: BORDER_RADIUS.md,
        borderLeft: `3px solid ${COLORS.accent.success}`
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
        <span style={{ color: COLORS.accent.success, fontWeight: 'bold', fontSize: '12px' }}>
          Bet #{betNumber}
        </span>
        <span style={{ color: COLORS.text.secondary, fontSize: '10px' }}>
          {betsAgo} bet{betsAgo !== 1 ? 's' : ''} ago
        </span>
      </div>
      <div style={{ color: COLORS.text.tertiary, fontSize: '10px' }}>{timeStr}</div>
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
  initialRiskMode = DEFAULTS.riskMode,
  initialLookback = DEFAULTS.lookback,
  initialGraphType = DEFAULTS.graphType
}) {
  const [riskMode, setRiskMode] = useState(initialRiskMode);
  const [lookback, setLookback] = useState(initialLookback);
  const [graphType, setGraphType] = useState(initialGraphType);

  const totalBets = state.currentHistory.length;
  const hitRate = totalBets > 0 ? ((hits.length / totalBets) * 100).toFixed(1) : '0.0';

  const handleRiskModeChange = (e) => {
    const newMode = e.target.value;
    setRiskMode(newMode);
    saveGraphPreferences(newMode, lookback, graphType);
    if (onRiskModeChange) onRiskModeChange(newMode);
  };

  const handleLookbackChange = (e) => {
    const value = parseInt(e.target.value) || 50;
    const min = parseInt(e.target.min);
    const max = parseInt(e.target.max);
    const clampedValue = Math.min(Math.max(value, min), max);
    setLookback(clampedValue);
    saveGraphPreferences(riskMode, clampedValue, graphType);
    if (onLookbackChange) onLookbackChange(clampedValue);
  };

  const handleGraphTypeChange = (e) => {
    const newType = e.target.value;
    setGraphType(newType);
    saveGraphPreferences(riskMode, lookback, newType);
  };

  return (
    <Modal
      title="Combination Stats"
      icon={<BarChart3 size={16} strokeWidth={2} />}
      onClose={onClose}
      defaultPosition={{ x: window.innerWidth / 2 - 250, y: 50 }}
      defaultSize={{ width: 500, height: 'auto' }}
      zIndex={1000001}
    >
      {/* Combination summary */}
      <div
        style={{
          background: COLORS.bg.dark,
          padding: '15px',
          borderRadius: BORDER_RADIUS.lg,
          marginBottom: '15px',
          borderLeft: `3px solid ${COLORS.accent.success}`
        }}
      >
        <div
          style={{
            color: COLORS.text.primary,
            fontSize: '15px',
            fontWeight: 'bold',
            marginBottom: '8px'
          }}
        >
          {numbers.join(', ')}
        </div>
        <div style={{ color: COLORS.text.secondary, fontSize: '12px', marginBottom: '12px' }}>
          {comboName}
        </div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            paddingTop: '10px',
            borderTop: `1px solid ${COLORS.border.lighter}`
          }}
        >
          <div>
            <div style={{ color: COLORS.accent.success, fontSize: '20px', fontWeight: 'bold' }}>
              {hits.length}
            </div>
            <div style={{ color: COLORS.text.tertiary, fontSize: '10px' }}>Complete Hits</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ color: COLORS.accent.info, fontSize: '20px', fontWeight: 'bold' }}>
              {hitRate}%
            </div>
            <div style={{ color: COLORS.text.tertiary, fontSize: '10px' }}>Hit Rate</div>
          </div>
        </div>
      </div>

      {/* Graph controls */}
      <div style={{
        display: 'flex',
        gap: '8px',
        marginBottom: '15px',
        padding: '12px',
        background: COLORS.bg.darker,
        borderRadius: BORDER_RADIUS.md,
        alignItems: 'flex-end'
      }}>
        <div style={{ flex: 1 }}>
          <label style={{ ...LABEL_STYLES.base }}>
            Graph Type
          </label>
          <select
            value={graphType}
            onChange={handleGraphTypeChange}
            style={{ ...INPUT_STYLES.select, width: '100%' }}
          >
            <option value="distribution">Distribution</option>
            <option value="profitloss">Profit/Loss</option>
          </select>
        </div>
        <div style={{ flex: 1 }}>
          <label style={{ ...LABEL_STYLES.base }}>
            Risk Mode
          </label>
          <select
            value={riskMode}
            onChange={handleRiskModeChange}
            style={{ ...INPUT_STYLES.select, width: '100%' }}
          >
            <option value="classic">Classic</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </div>
        <div>
          <label style={{ ...LABEL_STYLES.base }}>
            Lookback
          </label>
          <input
            type="number"
            min={DEFAULTS.lookbackMin}
            max={totalBets}
            value={lookback}
            onChange={handleLookbackChange}
            style={{ ...INPUT_STYLES.number, width: '70px' }}
          />
        </div>
      </div>

      {/* Payout graph */}
      {betMultipliers && graphType === 'distribution' && (
        <PayoutGraph
          numbers={numbers}
          history={state.currentHistory}
          betMultipliers={betMultipliers}
          riskMode={riskMode}
          lookback={lookback}
        />
      )}

      {/* Profit/Loss graph */}
      {betMultipliers && graphType === 'profitloss' && (
        <ProfitLossGraph
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
            color: COLORS.text.tertiary,
            textAlign: 'center',
            padding: '30px 20px',
            background: COLORS.bg.dark,
            borderRadius: BORDER_RADIUS.lg
          }}
        >
          This combination has never hit all numbers in your bet history.
        </div>
      ) : (
        <>
          <div style={{ marginBottom: '10px' }}>
            <h3 style={{ color: COLORS.accent.info, fontSize: '14px', margin: '0 0 10px 0' }}>
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
          borderTop: `1px solid ${COLORS.border.default}`
        }}
      >
        <div style={{ color: COLORS.text.tertiary, fontSize: '11px', lineHeight: '1.5' }}>
          <strong style={{ color: COLORS.text.secondary }}>Note:</strong> Shows all bets where every number in
          this combination appeared in the drawn numbers.
        </div>
      </div>
    </Modal>
  );
}
