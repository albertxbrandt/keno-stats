/**
 * Coin Flipper utility
 * Simple coin flip with animation and history tracking
 */

import { h } from 'preact';
import { useState, useEffect } from 'preact/hooks';
import { Modal } from '@/shared/components/Modal';
import { Button } from '@/shared/components/Button';
import { Coins } from 'lucide-preact';
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
    <Modal
      title="Coin Flipper"
      icon={<Coins size={18} />}
      onClose={onClose}
      defaultPosition={{ x: 100, y: 100 }}
      defaultSize={{ width: 400, height: 580 }}
      resizable={false}
      zIndex="9999999"
    >
      {/* Coin Display */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: SPACING.lg,
          marginBottom: SPACING.xl,
          padding: `${SPACING.xl} ${SPACING.xl}`,
          minHeight: '280px',
          background: COLORS.bg.darker,
          borderRadius: '12px',
          border: `1px solid ${COLORS.border.default}`,
        }}
      >
        <div
          style={{
            width: '160px',
            height: '160px',
            borderRadius: '50%',
            background: isFlipping
              ? `radial-gradient(circle at 30% 30%, ${COLORS.bg.light}, ${COLORS.bg.darker})`
              : result === 'heads'
              ? 'radial-gradient(circle at 30% 30%, #fbbf24, #d97706)'
              : result === 'tails'
              ? 'radial-gradient(circle at 30% 30%, #94a3b8, #64748b)'
              : `radial-gradient(circle at 30% 30%, ${COLORS.bg.light}, ${COLORS.bg.dark})`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: isFlipping
              ? '0 8px 32px rgba(251, 191, 36, 0.3)'
              : result === 'heads'
              ? '0 8px 32px rgba(251, 191, 36, 0.4)'
              : result === 'tails'
              ? '0 8px 32px rgba(100, 116, 139, 0.4)'
              : '0 4px 16px rgba(0, 0, 0, 0.2)',
            animation: isFlipping ? 'spin 1s ease-in-out' : 'none',
            border: `3px solid ${
              isFlipping
                ? 'rgba(251, 191, 36, 0.3)'
                : result === 'heads'
                ? 'rgba(251, 191, 36, 0.5)'
                : result === 'tails'
                ? 'rgba(100, 116, 139, 0.5)'
                : COLORS.border.default
            }`,
            transition: 'all 0.3s ease',
            position: 'relative',
          }}
        >
          {/* Coin Face Design */}
          {isFlipping ? (
            // Neutral spinning state - simple circle
            <svg width="80" height="80" viewBox="0 0 80 80">
              <circle cx="40" cy="40" r="25" fill="none" stroke="rgba(0, 0, 0, 0.4)" strokeWidth="3" />
            </svg>
          ) : result === 'heads' ? (
            // Heads side - star pattern
            <svg width="80" height="80" viewBox="0 0 80 80">
              <circle cx="40" cy="40" r="28" fill="none" stroke="rgba(0, 0, 0, 0.5)" strokeWidth="2.5" />
              <circle cx="40" cy="40" r="20" fill="none" stroke="rgba(0, 0, 0, 0.5)" strokeWidth="2.5" />
              <circle cx="40" cy="40" r="7" fill="rgba(0, 0, 0, 0.6)" />
              <circle cx="40" cy="20" r="5" fill="rgba(0, 0, 0, 0.6)" />
              <circle cx="40" cy="60" r="5" fill="rgba(0, 0, 0, 0.6)" />
              <circle cx="20" cy="40" r="5" fill="rgba(0, 0, 0, 0.6)" />
              <circle cx="60" cy="40" r="5" fill="rgba(0, 0, 0, 0.6)" />
            </svg>
          ) : result === 'tails' ? (
            // Tails side - cross pattern
            <svg width="80" height="80" viewBox="0 0 80 80">
              <circle cx="40" cy="40" r="28" fill="none" stroke="rgba(0, 0, 0, 0.5)" strokeWidth="2.5" />
              <line x1="40" y1="20" x2="40" y2="60" stroke="rgba(0, 0, 0, 0.6)" strokeWidth="5" strokeLinecap="round" />
              <line x1="20" y1="40" x2="60" y2="40" stroke="rgba(0, 0, 0, 0.6)" strokeWidth="5" strokeLinecap="round" />
              <circle cx="28" cy="28" r="4" fill="rgba(0, 0, 0, 0.5)" />
              <circle cx="52" cy="28" r="4" fill="rgba(0, 0, 0, 0.5)" />
              <circle cx="28" cy="52" r="4" fill="rgba(0, 0, 0, 0.5)" />
              <circle cx="52" cy="52" r="4" fill="rgba(0, 0, 0, 0.5)" />
            </svg>
          ) : (
            // Default neutral state - simple circle
            <svg width="80" height="80" viewBox="0 0 80 80">
              <circle cx="40" cy="40" r="25" fill="none" stroke="rgba(0, 0, 0, 0.4)" strokeWidth="3" />
            </svg>
          )}
        </div>

        {/* Always show text to prevent layout shift */}
        <div
          style={{
            fontSize: '20px',
            fontWeight: '600',
            color: isFlipping 
              ? COLORS.text.secondary 
              : result === 'heads' 
              ? '#fbbf24' 
              : result === 'tails'
              ? '#94a3b8'
              : COLORS.text.secondary,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            minHeight: '24px',
          }}
        >
          {isFlipping ? 'Flipping...' : result || '\u00A0'}
        </div>
      </div>

      {/* Flip Button */}
      <Button
        variant="primary"
        size="lg"
        fullWidth
        disabled={isFlipping}
        onClick={flipCoin}
        style={{ marginBottom: SPACING.lg }}
      >
        {isFlipping ? 'Flipping...' : 'Flip Coin'}
      </Button>

      {/* Stats */}
      {totalFlips > 0 && (
        <div
          style={{
            background: COLORS.bg.darker,
            borderRadius: '8px',
            padding: SPACING.md,
            marginBottom: SPACING.md,
            border: `1px solid ${COLORS.border.default}`,
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginBottom: SPACING.md,
              paddingBottom: SPACING.sm,
              borderBottom: `1px solid ${COLORS.border.light}`,
            }}
          >
            <span
              style={{
                fontWeight: '600',
                color: COLORS.text.primary,
                fontSize: '13px',
                letterSpacing: '0.01em',
              }}
            >
              Total Flips
            </span>
            <span
              style={{
                fontWeight: '700',
                color: COLORS.text.primary,
                fontSize: '14px',
              }}
            >
              {totalFlips}
            </span>
          </div>

          {/* Heads Stats */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: SPACING.sm,
              padding: SPACING.sm,
              background: 'rgba(251, 191, 36, 0.05)',
              borderRadius: '6px',
              border: '1px solid rgba(251, 191, 36, 0.1)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: SPACING.sm }}>
              <div
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: '#fbbf24',
                  boxShadow: '0 0 8px rgba(251, 191, 36, 0.5)',
                }}
              />
              <span
                style={{
                  color: COLORS.text.primary,
                  fontSize: '13px',
                  fontWeight: '500',
                }}
              >
                Heads
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: SPACING.xs }}>
              <span
                style={{
                  color: '#fbbf24',
                  fontSize: '15px',
                  fontWeight: '600',
                }}
              >
                {stats.heads}
              </span>
              <span
                style={{
                  color: COLORS.text.secondary,
                  fontSize: '12px',
                  fontWeight: '500',
                }}
              >
                ({headsPercent}%)
              </span>
            </div>
          </div>

          {/* Tails Stats */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: SPACING.sm,
              background: 'rgba(148, 163, 184, 0.05)',
              borderRadius: '6px',
              border: '1px solid rgba(148, 163, 184, 0.1)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: SPACING.sm }}>
              <div
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: '#94a3b8',
                  boxShadow: '0 0 8px rgba(148, 163, 184, 0.5)',
                }}
              />
              <span
                style={{
                  color: COLORS.text.primary,
                  fontSize: '13px',
                  fontWeight: '500',
                }}
              >
                Tails
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: SPACING.xs }}>
              <span
                style={{
                  color: '#94a3b8',
                  fontSize: '15px',
                  fontWeight: '600',
                }}
              >
                {stats.tails}
              </span>
              <span
                style={{
                  color: COLORS.text.secondary,
                  fontSize: '12px',
                  fontWeight: '500',
                }}
              >
                ({tailsPercent}%)
              </span>
            </div>
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
              marginBottom: SPACING.sm,
            }}
          >
            <span
              style={{
                color: COLORS.text.secondary,
                fontSize: '11px',
                fontWeight: '600',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              Recent Flips (Last 10)
            </span>
            <button
              onClick={clearHistory}
              style={{
                background: 'transparent',
                border: `1px solid ${COLORS.border.default}`,
                color: COLORS.text.secondary,
                borderRadius: '4px',
                padding: '4px 10px',
                fontSize: '11px',
                cursor: 'pointer',
                fontWeight: '500',
                transition: 'all 0.2s ease',
              }}
              onMouseOver={(e) => {
                e.target.style.borderColor = COLORS.text.secondary;
                e.target.style.color = COLORS.text.primary;
              }}
              onMouseOut={(e) => {
                e.target.style.borderColor = COLORS.border.default;
                e.target.style.color = COLORS.text.secondary;
              }}
            >
              Clear
            </button>
          </div>
          <div
            style={{
              display: 'flex',
              gap: SPACING.xs,
              flexWrap: 'wrap',
              padding: SPACING.sm,
              background: COLORS.bg.darker,
              borderRadius: '6px',
              border: `1px solid ${COLORS.border.default}`,
            }}
          >
            {history.slice(0, 10).map((flip, i) => (
              <div
                key={i}
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  background:
                    flip.result === 'heads'
                      ? 'radial-gradient(circle at 30% 30%, #fbbf24, #d97706)'
                      : 'radial-gradient(circle at 30% 30%, #94a3b8, #64748b)',
                  border: `2px solid ${
                    flip.result === 'heads'
                      ? 'rgba(251, 191, 36, 0.3)'
                      : 'rgba(148, 163, 184, 0.3)'
                  }`,
                  boxShadow:
                    flip.result === 'heads'
                      ? '0 2px 8px rgba(251, 191, 36, 0.3)'
                      : '0 2px 8px rgba(148, 163, 184, 0.3)',
                  transition: 'transform 0.2s ease',
                  cursor: 'default',
                }}
                title={flip.result}
                onMouseOver={(e) => {
                  e.target.style.transform = 'scale(1.1)';
                }}
                onMouseOut={(e) => {
                  e.target.style.transform = 'scale(1)';
                }}
              />
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
    </Modal>
  );
}
