/**
 * Coin Flipper utility
 * Simple coin flip with animation and history tracking
 */

import { h } from 'preact';
import { useState, useEffect } from 'preact/hooks';
import { Modal } from '@/shared/components/Modal';
import { Button } from '@/shared/components/Button';
import { Coins, Club, Spade } from 'lucide-preact';
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
            width: '180px',
            height: '180px',
            borderRadius: '50%',
            background: isFlipping
              ? 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)'
              : result === 'heads'
              ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
              : result === 'tails'
              ? 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)'
              : 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: isFlipping
              ? '0 10px 40px rgba(255, 215, 0, 0.4)'
              : result === 'heads'
              ? '0 10px 40px rgba(16, 185, 129, 0.5)'
              : result === 'tails'
              ? '0 10px 40px rgba(59, 130, 246, 0.5)'
              : '0 4px 16px rgba(0, 0, 0, 0.2)',
            animation: isFlipping ? 'spin 1s ease-in-out' : 'none',
            border: `4px solid ${
              isFlipping
                ? '#FFED4E'
                : result === 'heads'
                ? '#34d399'
                : result === 'tails'
                ? '#60a5fa'
                : '#FFED4E'
            }`,
            transition: 'all 0.3s ease',
            position: 'relative',
          }}
        >
          {/* Coin Face Design */}
          {isFlipping ? (
            // Neutral spinning state
            <Coins size={72} strokeWidth={2.5} color="#ffffff" />
          ) : result === 'heads' ? (
            // Heads side - Club (Green for luck)
            <Club size={80} strokeWidth={2.5} color="#ffffff" fill="#ffffff" />
          ) : result === 'tails' ? (
            // Tails side - Spade (Blue)
            <Spade size={80} strokeWidth={2.5} color="#ffffff" fill="#ffffff" />
          ) : (
            // Default neutral state
            <Coins size={72} strokeWidth={2.5} color="#ffffff" />
          )}
        </div>

        {/* Always show text to prevent layout shift */}
        <div
          style={{
            fontSize: '20px',
            fontWeight: '600',
            color: isFlipping 
              ? '#FFD700' 
              : result === 'heads' 
              ? '#10b981' 
              : result === 'tails'
              ? '#3b82f6'
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
