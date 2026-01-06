import { h } from 'preact';
import { useState, useEffect } from 'preact/hooks';
import { Modal } from '@/shared/components/Modal';
import { useUtilities } from '../hooks/useUtilities';
import { COLORS } from '@/shared/constants/colors.js';
import { BORDER_RADIUS, SPACING } from '@/shared/constants/styles.js';

const storageApi = typeof browser !== 'undefined' ? browser : chrome;
const STORAGE_KEY = 'randomGamePicker';

/**
 * Random Game Picker utility
 * Picks a random game from the games displayed on the current page
 */
export function RandomGamePicker() {
  const { closeUtility } = useUtilities();
  const [games, setGames] = useState([]);
  const [pickedGame, setPickedGame] = useState(null);
  const [history, setHistory] = useState([]);
  const [isPicking, setIsPicking] = useState(false);
  const [shuffleGame, setShuffleGame] = useState(null);

  // Load history from storage
  useEffect(() => {
    storageApi.storage.local.get(STORAGE_KEY, (result) => {
      if (result[STORAGE_KEY]?.history) {
        setHistory(result[STORAGE_KEY].history.slice(0, 10));
      }
    });
  }, []);

  // Scan for games on page
  useEffect(() => {
    scanGames();
  }, []);

  const scanGames = () => {
    const gameLinks = document.querySelectorAll('.card-list a.link[href*="/casino/games/"]');
    const scannedGames = Array.from(gameLinks).map(link => {
      const img = link.querySelector('img');
      const categoryEl = link.querySelector('.game-group strong');
      
      return {
        name: img?.alt || 'Unknown Game',
        imageUrl: img?.src || '',
        gameUrl: link.href,
        category: categoryEl?.textContent || 'Unknown'
      };
    }).filter(game => game.imageUrl); // Filter out games without images

    setGames(scannedGames);
  };

  const pickRandomGame = () => {
    if (games.length === 0) {
      scanGames(); // Try scanning again
      return;
    }

    setIsPicking(true);

    // Shuffle animation - cycle through games rapidly
    let shuffleCount = 0;
    const maxShuffles = 20;
    // eslint-disable-next-line no-restricted-syntax, no-restricted-globals
    const shuffleInterval = setInterval(() => {
      const randomIndex = Math.floor(Math.random() * games.length);
      setShuffleGame(games[randomIndex]);
      shuffleCount++;

      if (shuffleCount >= maxShuffles) {
        clearInterval(shuffleInterval);
        // Final pick
        const finalIndex = Math.floor(Math.random() * games.length);
        const picked = games[finalIndex];
        
        setPickedGame(picked);
        setShuffleGame(null);
        setIsPicking(false);

        // Add to history
        const newEntry = {
          ...picked,
          timestamp: Date.now()
        };
        const newHistory = [newEntry, ...history].slice(0, 10);
        setHistory(newHistory);
        
        // Save to storage
        storageApi.storage.local.set({
          [STORAGE_KEY]: { history: newHistory }
        });
      }
    }, 80);
  };

  const playGame = (gameUrl) => {
    window.location.href = gameUrl;
  };

  const clearHistory = () => {
    setHistory([]);
    storageApi.storage.local.set({ [STORAGE_KEY]: { history: [] } });
  };

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  const displayGame = isPicking ? shuffleGame : pickedGame;

  return h(Modal, {
    title: '🎮 Random Game Picker',
    onClose: () => closeUtility('randomGamePicker'),
    defaultWidth: 340,
    defaultHeight: 600,
    defaultX: window.innerWidth / 2 - 170,
    defaultY: 60
  }, h('div', {
    style: {
      padding: SPACING.lg,
      color: COLORS.text.primary,
      fontSize: '13px',
      display: 'flex',
      flexDirection: 'column',
      gap: SPACING.lg,
      height: '100%',
      overflowY: 'auto'
    }
  }, [
    // Game count and rescan
    h('div', {
      style: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: SPACING.md,
        background: COLORS.bg.darker,
        borderRadius: BORDER_RADIUS.md,
        border: `1px solid ${COLORS.border.default}`
      }
    }, [
      h('span', {
        style: {
          fontSize: '12px',
          color: COLORS.text.secondary
        }
      }, games.length === 0 ? 'No games found on this page' : `${games.length} games found`),
      h('button', {
        onClick: scanGames,
        style: {
          padding: '4px 10px',
          background: 'transparent',
          color: COLORS.accent.info,
          border: `1px solid ${COLORS.accent.info}`,
          borderRadius: BORDER_RADIUS.sm,
          fontSize: '11px',
          cursor: 'pointer',
          transition: 'all 0.2s'
        }
      }, '🔄 Rescan')
    ]),

    // Pick button
    h('button', {
      onClick: pickRandomGame,
      disabled: isPicking || games.length === 0,
      style: {
        padding: '16px 24px',
        background: isPicking || games.length === 0 ? COLORS.bg.darkest : COLORS.accent.success,
        color: COLORS.text.primary,
        border: 'none',
        borderRadius: BORDER_RADIUS.md,
        fontSize: '16px',
        fontWeight: '700',
        cursor: isPicking || games.length === 0 ? 'not-allowed' : 'pointer',
        transition: 'all 0.3s',
        opacity: isPicking || games.length === 0 ? 0.6 : 1,
        transform: isPicking ? 'scale(0.98)' : 'scale(1)'
      }
    }, isPicking ? '🎰 Picking...' : '🎮 Pick Random Game'),

    // Picked/Shuffling game display
    displayGame && h('div', {
      style: {
        padding: SPACING.lg,
        background: COLORS.bg.darker,
        borderRadius: BORDER_RADIUS.lg,
        border: `2px solid ${isPicking ? COLORS.accent.warning : COLORS.accent.success}`,
        display: 'flex',
        flexDirection: 'column',
        gap: SPACING.md,
        animation: isPicking ? 'pulse 0.5s infinite' : 'fadeIn 0.5s ease',
        transition: 'all 0.3s'
      }
    }, [
      // Game image
      h('div', {
        style: {
          width: '100%',
          height: '200px',
          borderRadius: BORDER_RADIUS.md,
          overflow: 'hidden',
          background: COLORS.bg.darkest,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }
      }, h('img', {
        src: displayGame.imageUrl,
        alt: displayGame.name,
        style: {
          maxWidth: '100%',
          maxHeight: '100%',
          objectFit: 'contain'
        }
      })),

      // Game info
      h('div', {
        style: {
          display: 'flex',
          flexDirection: 'column',
          gap: SPACING.sm
        }
      }, [
        h('div', {
          style: {
            fontSize: '20px',
            fontWeight: '700',
            color: COLORS.text.primary,
            textAlign: 'center'
          }
        }, displayGame.name),
        h('div', {
          style: {
            fontSize: '11px',
            color: COLORS.text.tertiary,
            textAlign: 'center',
            textTransform: 'uppercase',
            letterSpacing: '0.5px'
          }
        }, displayGame.category)
      ]),

      // Play Now button (only when not picking)
      !isPicking && h('button', {
        onClick: () => playGame(displayGame.gameUrl),
        style: {
          padding: '12px 20px',
          background: COLORS.accent.info,
          color: COLORS.text.primary,
          border: 'none',
          borderRadius: BORDER_RADIUS.md,
          fontSize: '14px',
          fontWeight: '600',
          cursor: 'pointer',
          transition: 'all 0.2s',
          marginTop: SPACING.sm
        }
      }, '▶️ Play Now')
    ]),

    // History section
    h('div', {
      style: {
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        gap: SPACING.sm
      }
    }, [
      h('div', {
        style: {
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }
      }, [
        h('span', {
          style: {
            fontSize: '11px',
            color: COLORS.text.secondary,
            fontWeight: '600',
            textTransform: 'uppercase'
          }
        }, `History (${history.length})`),
        history.length > 0 && h('button', {
          onClick: clearHistory,
          style: {
            padding: '4px 8px',
            background: 'transparent',
            color: COLORS.accent.error,
            border: `1px solid ${COLORS.accent.error}`,
            borderRadius: BORDER_RADIUS.sm,
            fontSize: '10px',
            cursor: 'pointer'
          }
        }, 'Clear')
      ]),

      h('div', {
        style: {
          display: 'flex',
          flexDirection: 'column',
          gap: SPACING.sm,
          maxHeight: '200px',
          overflowY: 'auto'
        }
      }, history.length === 0 ? h('div', {
        style: {
          padding: SPACING.lg,
          textAlign: 'center',
          color: COLORS.text.tertiary,
          fontSize: '12px'
        }
      }, 'No history yet. Pick a game!') : history.map((entry, idx) => h('div', {
        key: idx,
        onClick: () => playGame(entry.gameUrl),
        style: {
          padding: SPACING.sm,
          background: COLORS.bg.darker,
          borderRadius: BORDER_RADIUS.sm,
          border: `1px solid ${COLORS.border.default}`,
          display: 'flex',
          alignItems: 'center',
          gap: SPACING.sm,
          cursor: 'pointer',
          transition: 'all 0.2s'
        },
        onMouseEnter: (e) => { e.currentTarget.style.background = COLORS.bg.darkest; },
        onMouseLeave: (e) => { e.currentTarget.style.background = COLORS.bg.darker; }
      }, [
        h('img', {
          src: entry.imageUrl,
          alt: entry.name,
          style: {
            width: '40px',
            height: '52px',
            borderRadius: BORDER_RADIUS.sm,
            objectFit: 'cover'
          }
        }),
        h('div', {
          style: {
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            gap: '2px'
          }
        }, [
          h('div', {
            style: {
              fontSize: '12px',
              fontWeight: '600',
              color: COLORS.text.primary
            }
          }, entry.name),
          h('div', {
            style: {
              fontSize: '10px',
              color: COLORS.text.tertiary
            }
          }, entry.category)
        ]),
        h('span', {
          style: {
            fontSize: '10px',
            color: COLORS.text.tertiary
          }
        }, formatDate(entry.timestamp))
      ])))
    ])
  ]));
}
