// src/ui/components/modals/BetResultModal.jsx
// Modal displaying detailed bet result breakdown

import { h } from 'preact';
import { COLORS } from '@/shared/constants/colors';
import { BORDER_RADIUS } from '@/shared/constants/styles.js';

/**
 * Number Tile Component
 * @param {Object} props
 * @param {number} props.num - The number to display
 * @param {boolean} props.isHit - Whether this was a hit (selected and drawn)
 * @param {boolean} props.isMiss - Whether this was a miss (drawn but not selected)
 * @param {boolean} props.isSelected - Whether currently selected in UI
 * @returns {preact.VNode}
 */
function NumberTile({ num, isHit, isMiss, isSelected }) {
  let bgColor = '#2f4553';
  let textColor = COLORS.text.primary;
  let borderStyle = '2px solid #2f4553';
  let boxShadow = 'none';

  if (isHit) {
    // Hit - selected number that was drawn (green)
    bgColor = 'linear-gradient(135deg, #00ff88, #00c853)';
    textColor = '#000';
    borderStyle = '2px solid #00ff88';
    boxShadow = '0 3px 8px rgba(0,200,83,0.4)';
  } else if (isMiss) {
    // Miss - drawn number not selected (red)
    bgColor = '#071824';
    textColor = '#ff6b5b';
    borderStyle = '2px solid #ff6b5b';
    boxShadow = '0 3px 8px rgba(255,71,87,0.2)';
  }

  // Add dashed yellow border for currently selected numbers
  if (isSelected) {
    borderStyle = '3px dashed #ffa500';
  }

  return (
    <div
      style={{
        width: '36px',
        height: '36px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: bgColor,
        color: textColor,
        borderRadius: BORDER_RADIUS.md,
        fontWeight: '700',
        fontSize: '12px',
        border: borderStyle,
        boxShadow: boxShadow,
        transition: 'all 0.2s ease'
      }}
    >
      {num}
    </div>
  );
}

/**
 * Board Tile Component (for 1-40 grid)
 * @param {Object} props
 * @param {number} props.num - The number to display
 * @param {boolean} props.isHit - Whether this was a hit
 * @param {boolean} props.isMiss - Whether this was a miss
 * @param {boolean} props.isSelected - Whether currently selected
 * @returns {preact.VNode}
 */
function BoardTile({ num, isHit, isMiss, isSelected }) {
  let bgColor = '#2f4553';
  let textColor = COLORS.text.primary;
  let borderStyle = '2px solid #2f4553';
  let boxShadow = 'none';

  if (isHit) {
    bgColor = 'linear-gradient(135deg, #00ff88, #00c853)';
    textColor = '#000';
    borderStyle = '2px solid #00ff88';
    boxShadow = '0 3px 8px rgba(0,200,83,0.4)';
  } else if (isMiss) {
    bgColor = '#071824';
    textColor = '#ff6b5b';
    borderStyle = '2px solid #ff6b5b';
    boxShadow = '0 3px 8px rgba(255,71,87,0.2)';
  }

  if (isSelected) {
    borderStyle = '3px dashed #ffa500';
  }

  return (
    <div
      style={{
        width: '100%',
        aspectRatio: '1',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: bgColor,
        color: textColor,
        borderRadius: '5px',
        fontWeight: '700',
        fontSize: '10px',
        border: borderStyle,
        boxShadow: boxShadow,
        transition: 'all 0.2s ease'
      }}
    >
      {num}
    </div>
  );
}

/**
 * BetResultModal Component
 * 
 * Displays detailed breakdown of a historical bet result.
 * Shows hits, misses, and full board visualization.
 * 
 * @component
 * @param {Object} props
 * @param {Object} props.round - Round data from history
 * @param {number} props.betIndex - Index of bet in history
 * @param {number} props.totalRounds - Total number of rounds
 * @param {Array<number>} props.hits - Numbers that hit
 * @param {Array<number>} props.misses - Numbers that missed
 * @param {Array<number>} props.selectedNumbers - Currently selected numbers (for highlighting)
 * @param {Function} props.onClose - Close handler
 * @returns {preact.VNode}
 */
export function BetResultModal({ round, betIndex, totalRounds, hits, misses, selectedNumbers, onClose }) {
  const dateStr = new Date(round.time).toLocaleString();
  const betNumber = betIndex + 1;
  const betsAgo = totalRounds - betIndex;

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        backgroundColor: 'rgba(0,0,0,0.85)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10000,
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
      }}
      onClick={handleBackdropClick}
    >
      <div
        style={{
          backgroundColor: COLORS.bg.dark,
          borderRadius: '12px',
          padding: '16px',
          maxWidth: '600px',
          width: '92%',
          maxHeight: '85vh',
          overflow: 'auto',
          border: `2px solid ${COLORS.border.default}`,
          boxShadow: '0 20px 60px rgba(0,200,83,0.15)',
          color: COLORS.text.primary
        }}
      >
        {/* Header */}
        <div style={{ position: 'relative', marginBottom: '14px' }}>
          <button
            onClick={onClose}
            style={{
              position: 'absolute',
              top: '-8px',
              right: '-8px',
              width: '24px',
              height: '24px',
              background: 'transparent',
              border: 'none',
              color: COLORS.accent.error,
              fontSize: '24px',
              fontWeight: '400',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s ease',
              padding: 0,
              lineHeight: 1
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.2)';
              e.currentTarget.style.color = '#ff6b6b';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.color = COLORS.accent.error;
            }}
          >
            ×
          </button>
          <div>
            <h2 style={{ margin: '0 0 4px 0', color: COLORS.text.primary, fontSize: '18px', fontWeight: '600' }}>
              Bet Result
            </h2>
            <p style={{ margin: '0 0 2px 0', color: COLORS.accent.info, fontSize: '12px', fontWeight: '600' }}>
              Bet #{betNumber} - {betsAgo} Bets Ago
            </p>
            <p style={{ margin: 0, color: COLORS.text.secondary, fontSize: '11px' }}>
              {dateStr}
            </p>
          </div>
        </div>

        {/* Result Summary */}
        <div
          style={{
            marginBottom: '12px',
            padding: '12px',
            background: 'linear-gradient(135deg, #00c85325, #00c85310)',
            borderRadius: '10px',
            borderLeft: `3px solid ${COLORS.accent.success}`
          }}
        >
          <p style={{ margin: '0 0 4px 0', color: COLORS.text.primary, fontSize: '10px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Result
          </p>
          <p style={{ margin: 0, fontSize: '20px', fontWeight: '700', color: COLORS.accent.success }}>
            {hits.length} Hits
          </p>
        </div>

        {/* Hits Section */}
        <div style={{ marginBottom: '12px' }}>
          <p style={{ margin: '0 0 6px 0', color: COLORS.text.primary, fontSize: '10px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Hits ({hits.length})
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
            {hits.map(num => (
              <NumberTile
                key={num}
                num={num}
                isHit={true}
                isMiss={false}
                isSelected={selectedNumbers.includes(num)}
              />
            ))}
          </div>
        </div>

        {/* Misses Section */}
        <div style={{ marginBottom: '12px' }}>
          <p style={{ margin: '0 0 6px 0', color: COLORS.text.primary, fontSize: '10px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Misses ({misses.length})
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
            {misses.map(num => (
              <NumberTile
                key={num}
                num={num}
                isHit={false}
                isMiss={true}
                isSelected={selectedNumbers.includes(num)}
              />
            ))}
          </div>
        </div>

        {/* Full Board */}
        <div style={{ marginBottom: '14px' }}>
          <p style={{ margin: '0 0 6px 0', color: COLORS.text.primary, fontSize: '10px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Full Board (1-40)
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: '4px' }}>
            {Array.from({ length: 40 }, (_, i) => i + 1).map(num => (
              <BoardTile
                key={num}
                num={num}
                isHit={hits.includes(num)}
                isMiss={misses.includes(num)}
                isSelected={selectedNumbers.includes(num)}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
