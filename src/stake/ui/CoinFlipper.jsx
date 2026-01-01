/**
 * Coin Flipper utility
 * Simple coin flip with animation and history tracking
 */

import { h } from 'preact';
import { useState, useEffect } from 'preact/hooks';
import { COLORS } from '@/shared/constants/colors.js';
import { SPACING } from '@/shared/constants/styles.js';

export function CoinFlipper({ onClose }) {
  const [isFlipping, setIsFlipping] = useState(false);
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [stats, setStats] = useState({ heads: 0, tails: 0 });

  useEffect(() => {
    // Load history from storage
    const storageApi = typeof browser !== 'undefined' ? browser : chrome;
    storageApi.storage.local.get('coinFlipHistory').then((data) => {
      if (data.coinFlipHistory) {
        setHistory(data.coinFlipHistory.history || []);
        setStats(data.coinFlipHistory.stats || { heads: 0, tails: 0 });
      }
    });
  }, []);

  const saveHistory = (newHistory, newStats) => {
    const storageApi = typeof browser !== 'undefined' ? browser : chrome;
    storageApi.storage.local.set({
      coinFlipHistory: {
        history: newHistory,
        stats: newStats,
      },
    });
  };

  const flipCoin = () => {
    if (isFlipping) return;

    setIsFlipping(true);
    setResult(null);

    // Simulate flip duration
    setTimeout(() => {
      const flipResult = Math.random() < 0.5 ? 'heads' : 'tails';
      setResult(flipResult);
      setIsFlipping(false);

      // Update history and stats
      const newHistory = [
        { result: flipResult, timestamp: Date.now() },
        ...history.slice(0, 49), // Keep last 50
      ];
      const newStats = {
        heads: stats.heads + (flipResult === 'heads' ? 1 : 0),
        tails: stats.tails + (flipResult === 'tails' ? 1 : 0),
      };

      setHistory(newHistory);
      setStats(newStats);
      saveHistory(newHistory, newStats);
    }, 1000);
  };

  const clearHistory = () => {
    setHistory([]);
    setStats({ heads: 0, tails: 0 });
    saveHistory([], { heads: 0, tails: 0 });
  };

  const totalFlips = stats.heads + stats.tails;
  const headsPercent = totalFlips > 0 ? ((stats.heads / totalFlips) * 100).toFixed(1) : 0;
  const tailsPercent = totalFlips > 0 ? ((stats.tails / totalFlips) * 100).toFixed(1) : 0;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.8)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999999,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: COLORS.OVERLAY_BG,
          border: `1px solid ${COLORS.BORDER}`,
          borderRadius: '12px',
          padding: SPACING.LG,
          maxWidth: '500px',
          width: '90%',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: SPACING.MD,
          }}
        >
          <h2
            style={{
              margin: 0,
              color: COLORS.TEXT_PRIMARY,
              fontSize: '20px',
              fontWeight: 'bold',
            }}
          >
            🪙 Coin Flipper
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: COLORS.TEXT_SECONDARY,
              fontSize: '24px',
              cursor: 'pointer',
              padding: '4px',
            }}
          >
            ×
          </button>
        </div>

        {/* Coin Display */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: SPACING.MD,
            marginBottom: SPACING.LG,
          }}
        >
          <div
            style={{
              width: '150px',
              height: '150px',
              borderRadius: '50%',
              background: isFlipping
                ? 'linear-gradient(45deg, #FFD700, #FFA500)'
                : result === 'heads'
                ? 'linear-gradient(135deg, #FFD700, #FFA500)'
                : result === 'tails'
                ? 'linear-gradient(135deg, #C0C0C0, #808080)'
                : 'linear-gradient(135deg, #444, #666)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '48px',
              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.3)',
              animation: isFlipping ? 'spin 1s linear' : 'none',
            }}
          >
            {isFlipping ? '🪙' : result === 'heads' ? '👑' : result === 'tails' ? '🦅' : '🪙'}
          </div>

          {result && !isFlipping && (
            <div
              style={{
                fontSize: '24px',
                fontWeight: 'bold',
                color: result === 'heads' ? '#FFD700' : '#C0C0C0',
                textTransform: 'uppercase',
                letterSpacing: '2px',
              }}
            >
              {result}!
            </div>
          )}
        </div>

        {/* Flip Button */}
        <button
          onClick={flipCoin}
          disabled={isFlipping}
          style={{
            width: '100%',
            padding: SPACING.MD,
            background: isFlipping ? COLORS.DISABLED_BG : COLORS.PRIMARY,
            color: COLORS.TEXT_PRIMARY,
            border: 'none',
            borderRadius: '8px',
            fontSize: '16px',
            fontWeight: 'bold',
            cursor: isFlipping ? 'not-allowed' : 'pointer',
            marginBottom: SPACING.MD,
            opacity: isFlipping ? 0.6 : 1,
          }}
        >
          {isFlipping ? 'Flipping...' : 'Flip Coin'}
        </button>

        {/* Stats */}
        {totalFlips > 0 && (
          <div
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              borderRadius: '8px',
              padding: SPACING.MD,
              marginBottom: SPACING.MD,
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: SPACING.SM,
                color: COLORS.TEXT_PRIMARY,
              }}
            >
              <span style={{ fontWeight: 'bold' }}>Total Flips:</span>
              <span>{totalFlips}</span>
            </div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: SPACING.XS,
                color: COLORS.TEXT_PRIMARY,
              }}
            >
              <span>👑 Heads:</span>
              <span>
                {stats.heads} ({headsPercent}%)
              </span>
            </div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                color: COLORS.TEXT_PRIMARY,
              }}
            >
              <span>🦅 Tails:</span>
              <span>
                {stats.tails} ({tailsPercent}%)
              </span>
            </div>
          </div>
        )}

        {/* Recent History */}
        {history.length > 0 && (
          <div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: SPACING.SM,
              }}
            >
              <span
                style={{
                  color: COLORS.TEXT_SECONDARY,
                  fontSize: '12px',
                  fontWeight: 'bold',
                  textTransform: 'uppercase',
                }}
              >
                Recent Flips (Last 10)
              </span>
              <button
                onClick={clearHistory}
                style={{
                  background: 'transparent',
                  border: `1px solid ${COLORS.BORDER}`,
                  color: COLORS.TEXT_SECONDARY,
                  borderRadius: '4px',
                  padding: '4px 8px',
                  fontSize: '11px',
                  cursor: 'pointer',
                }}
              >
                Clear
              </button>
            </div>
            <div
              style={{
                display: 'flex',
                gap: SPACING.XS,
                flexWrap: 'wrap',
              }}
            >
              {history.slice(0, 10).map((flip, i) => (
                <div
                  key={i}
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    background:
                      flip.result === 'heads'
                        ? 'linear-gradient(135deg, #FFD700, #FFA500)'
                        : 'linear-gradient(135deg, #C0C0C0, #808080)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '16px',
                  }}
                  title={flip.result}
                >
                  {flip.result === 'heads' ? '👑' : '🦅'}
                </div>
              ))}
            </div>
          </div>
        )}

        <style>
          {`
            @keyframes spin {
              0% { transform: rotateY(0deg); }
              100% { transform: rotateY(1080deg); }
            }
          `}
        </style>
      </div>
    </div>
  );
}
