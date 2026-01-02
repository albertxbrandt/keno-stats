import { h } from 'preact';
import { useState, useEffect } from 'preact/hooks';
import { Modal } from '@/shared/components/Modal.jsx';
import { PayoutGraph } from '../PayoutGraph.jsx';
import { ProfitLossGraph } from '../ProfitLossGraph.jsx';
import { state } from '@/games/keno/core/state.js';
import { stateEvents, EVENTS } from '@/games/keno/core/stateEvents.js';
import { getSelectedTileNumbers, getBetButtonState } from '@/shared/utils/dom/domReader.js';
import { analyzeCombinationHits } from '@/shared/utils/analysis/combinationAnalysis.js';
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
 * Unified Stats Modal - tracks any set of numbers with live updates
 * @param {Array<number>} initialNumbers - Numbers to track (can be empty if trackLive=true)
 * @param {string} name - Display name for this combination
 * @param {boolean} trackLive - If true, reads currently selected numbers from DOM on each update
 * @param {Object} betMultipliers - Bet multipliers for payout calculations
 * @param {Function} onClose - Close handler
 */
export function StatsModal({
  initialNumbers = [],
  name = 'Combination',
  trackLive = false,
  betMultipliers,
  onClose,
  initialRiskMode = DEFAULTS.riskMode,
  initialLookback = DEFAULTS.lookback,
  initialGraphType = DEFAULTS.graphType
}) {
  const [numbers, setNumbers] = useState(initialNumbers);
  const [hits, setHits] = useState([]);
  const [riskMode, setRiskMode] = useState(initialRiskMode);
  const [lookback, setLookback] = useState(initialLookback);
  const [graphType, setGraphType] = useState(initialGraphType);
  const [historyVersion, setHistoryVersion] = useState(0); // Force re-renders on history changes

  // Update stats based on current numbers
  const updateStats = (currentNumbers) => {
    if (currentNumbers.length === 0) {
      setHits([]);
      return;
    }

    const newHits = analyzeCombinationHits(currentNumbers, state.currentHistory);
    setHits(newHits);
  };

  // Watch for tile selection changes when tracking live
  useEffect(() => {
    if (!trackLive) return;

    const tilesContainer = document.querySelector('[data-testid="game-keno"]');
    if (!tilesContainer) return;

    // Initial read - only if bet button is ready
    const btnState = getBetButtonState();
    if (btnState.ready) {
      const initialNumbers = getSelectedTileNumbers();
      if (initialNumbers.length >= 3) {
        setNumbers(initialNumbers);
        updateStats(initialNumbers);
      }
    }

    // Listen for click events on tiles (user interaction only)
    const handleTileClick = () => {
      // Small delay to let tile state update after click
      setTimeout(() => {
        // CRITICAL: Only read DOM if bet button is ready (not mid-round)
        const btnState = getBetButtonState();
        if (!btnState.ready) return;
        
        const currentNumbers = getSelectedTileNumbers();
        
        // Don't track less than 3 numbers (not useful for stats)
        if (currentNumbers.length < 3) {
          if (numbers.length > 0) {
            setNumbers([]);
            setHits([]);
          }
          return;
        }
        
        const currentNumbersStr = currentNumbers.sort((a, b) => a - b).join(',');
        const stateNumbersStr = numbers.sort((a, b) => a - b).join(',');
        
        // Only update if selection actually changed
        if (currentNumbersStr !== stateNumbersStr) {
          setNumbers(currentNumbers);
          updateStats(currentNumbers);
        }
      }, 50);
    };

    tilesContainer.addEventListener('click', handleTileClick);

    return () => {
      tilesContainer.removeEventListener('click', handleTileClick);
    };
  }, [numbers, trackLive]);

  // Subscribe to history events for all modals (live and fixed)
  useEffect(() => {
    const updateOnHistoryChange = () => {
      // Recalculate with current numbers state
      if (numbers.length > 0) {
        updateStats(numbers);
      }
      // Increment version to force graph re-renders
      setHistoryVersion(v => v + 1);
    };

    const unsubHistory = stateEvents.on(EVENTS.HISTORY_UPDATED, updateOnHistoryChange);
    const unsubRound = stateEvents.on(EVENTS.ROUND_SAVED, updateOnHistoryChange);

    // Initial calculation for fixed tracking
    if (!trackLive) {
      updateOnHistoryChange();
    }

    return () => {
      unsubHistory();
      unsubRound();
    };
  }, [numbers, trackLive]);

  const totalBets = state.currentHistory.length;
  const hitRate = totalBets > 0 && hits.length > 0 
    ? ((hits.length / totalBets) * 100).toFixed(1) 
    : '0.0';

  // Calculate last hit and typical gap
  const calculateHitStats = () => {
    if (hits.length === 0) {
      return { lastHit: null, typicalGap: null };
    }

    // Sort hits by historyIndex descending (most recent first)
    const sortedHits = hits.slice().sort((a, b) => b.historyIndex - a.historyIndex);

    // Last hit (most recent occurrence)
    const lastHitIndex = sortedHits[0].historyIndex;
    const lastHit = totalBets - lastHitIndex - 1; // -1 because index is 0-based

    // Calculate gaps between consecutive hits (sorted by time)
    const timeOrderedHits = hits.slice().sort((a, b) => a.historyIndex - b.historyIndex);
    const gaps = [];
    for (let i = 1; i < timeOrderedHits.length; i++) {
      const gap = timeOrderedHits[i].historyIndex - timeOrderedHits[i - 1].historyIndex;
      gaps.push(gap);
    }

    if (gaps.length === 0) {
      return { lastHit, typicalGap: null };
    }

    // Calculate 25th and 75th percentiles
    const sortedGaps = gaps.slice().sort((a, b) => a - b);
    const p25Index = Math.floor(sortedGaps.length * 0.25);
    const p75Index = Math.floor(sortedGaps.length * 0.75);
    const p25 = sortedGaps[p25Index];
    const p75 = sortedGaps[p75Index];

    return { lastHit, typicalGap: { min: p25, max: p75 } };
  };

  const hitStats = calculateHitStats();

  const handleRiskModeChange = (e) => {
    const newMode = e.target.value;
    setRiskMode(newMode);
    saveGraphPreferences(newMode, lookback, graphType);
  };

  const handleLookbackChange = (e) => {
    const value = parseInt(e.target.value) || 50;
    const min = parseInt(e.target.min);
    const max = parseInt(e.target.max);
    const clampedValue = Math.min(Math.max(value, min), max);
    setLookback(clampedValue);
    saveGraphPreferences(riskMode, clampedValue, graphType);
  };

  const handleGraphTypeChange = (e) => {
    const newType = e.target.value;
    setGraphType(newType);
    saveGraphPreferences(riskMode, lookback, newType);
  };

  // Show "no selection" state for live tracking
  if (trackLive && numbers.length === 0) {
    return (
      <Modal
        title={name}
        icon="📡"
        onClose={onClose}
        defaultPosition={{ x: window.innerWidth / 2 - 250, y: 50 }}
        defaultSize={{ width: 500, height: 'auto' }}
        zIndex={1000001}
      >
        <div
          style={{
            padding: '40px',
            textAlign: 'center',
            color: COLORS.text.tertiary
          }}
        >
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🎯</div>
          <div style={{ fontSize: '14px', marginBottom: '8px' }}>No Numbers Selected</div>
          <div style={{ fontSize: '11px' }}>
            Select 3 or more numbers on the board to track live statistics
          </div>
        </div>
      </Modal>
    );
  }

  const icon = trackLive ? '📡' : '📊';
  const borderColor = trackLive ? COLORS.accent.info : COLORS.accent.success;

  return (
    <Modal
      title={name}
      icon={icon}
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
          borderLeft: `3px solid ${borderColor}`
        }}
      >
        {trackLive && (
          <div
            style={{
              color: COLORS.text.secondary,
              fontSize: '11px',
              fontWeight: '600',
              marginBottom: '8px',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}
          >
            Currently Selected ({numbers.length} numbers)
          </div>
        )}
        <div
          style={{
            color: COLORS.text.primary,
            fontSize: '15px',
            fontWeight: 'bold',
            marginBottom: trackLive ? '12px' : '8px'
          }}
        >
          {numbers.join(', ')}
        </div>
        {!trackLive && (
          <div style={{ color: COLORS.text.secondary, fontSize: '12px', marginBottom: '12px' }}>
            {name}
          </div>
        )}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            paddingTop: '10px',
            borderTop: `1px solid ${COLORS.border.lighter}`,
            gap: '16px'
          }}
        >
          <div>
            <div style={{ color: COLORS.accent.success, fontSize: '20px', fontWeight: 'bold' }}>
              {hits.length}
            </div>
            <div style={{ color: COLORS.text.tertiary, fontSize: '10px' }}>Complete Hits</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ color: COLORS.accent.warning, fontSize: '20px', fontWeight: 'bold' }}>
              {hitStats.lastHit !== null ? `${hitStats.lastHit}` : '—'}
            </div>
            <div style={{ color: COLORS.text.tertiary, fontSize: '10px' }}>Last Hit</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ 
              color: COLORS.accent.info, 
              fontSize: hitStats.typicalGap ? '16px' : '20px', 
              fontWeight: 'bold',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              gap: '4px'
            }}>
              {hitStats.typicalGap 
                ? `${hitStats.typicalGap.min}-${hitStats.typicalGap.max}`
                : '—'
              }
              {hitStats.typicalGap && (
                <span 
                  title="Based on historical frequency (25th-75th percentile of gaps between hits)"
                  style={{ 
                    cursor: 'help',
                    fontSize: '12px',
                    opacity: 0.6
                  }}
                >
                  ⓘ
                </span>
              )}
            </div>
            <div style={{ color: COLORS.text.tertiary, fontSize: '10px' }}>
              {hitStats.typicalGap ? 'Typical Gap' : 'Hit Rate'}
            </div>
            {!hitStats.typicalGap && (
              <div style={{ color: COLORS.accent.info, fontSize: '20px', fontWeight: 'bold', marginTop: '4px' }}>
                {hitRate}%
              </div>
            )}
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
          key={`payout-${historyVersion}`}
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
          key={`profitloss-${historyVersion}`}
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
