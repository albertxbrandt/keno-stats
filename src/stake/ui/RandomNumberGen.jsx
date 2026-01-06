import { h } from 'preact';
import { useState, useEffect } from 'preact/hooks';
import { Modal } from '@/shared/components/Modal';
import { ToggleSwitch } from '@/shared/components/ToggleSwitch.jsx';
import { useUtilities } from '../hooks/useUtilities.js';
import { COLORS } from '@/shared/constants/colors.js';
import { BORDER_RADIUS, SPACING } from '@/shared/constants/styles.js';

const storageApi = typeof browser !== 'undefined' ? browser : chrome;
const STORAGE_KEY = 'randomNumberGen';

/**
 * Random Number Generator utility
 * Generates random numbers within a specified range
 */
export function RandomNumberGen() {
  const { closeUtility } = useUtilities();
  const [min, setMin] = useState(1);
  const [max, setMax] = useState(100);
  const [count, setCount] = useState(5);
  const [generated, setGenerated] = useState([]);
  const [history, setHistory] = useState([]);
  const [allowDuplicates, setAllowDuplicates] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);

  // Load settings from storage
  useEffect(() => {
    storageApi.storage.local.get(STORAGE_KEY, (result) => {
      if (result[STORAGE_KEY]) {
        const data = result[STORAGE_KEY];
        if (data.min !== undefined) setMin(data.min);
        if (data.max !== undefined) setMax(data.max);
        if (data.count !== undefined) setCount(data.count);
        if (data.allowDuplicates !== undefined) setAllowDuplicates(data.allowDuplicates);
        if (data.history) setHistory(data.history.slice(0, 20)); // Last 20 generations
      }
    });
  }, []);

  // Save settings to storage
  const saveSettings = (updates) => {
    storageApi.storage.local.get(STORAGE_KEY, (result) => {
      const data = result[STORAGE_KEY] || {};
      const newData = { ...data, ...updates };
      storageApi.storage.local.set({ [STORAGE_KEY]: newData });
    });
  };

  // Generate random numbers
  const generateNumbers = () => {
    const minVal = parseInt(min);
    const maxVal = parseInt(max);
    const countVal = parseInt(count);

    // Validation
    if (isNaN(minVal) || isNaN(maxVal) || isNaN(countVal)) {
      return;
    }

    if (minVal >= maxVal) {
      return;
    }

    if (countVal < 1 || countVal > 100) {
      return;
    }

    if (!allowDuplicates && countVal > (maxVal - minVal + 1)) {
      return;
    }

    setIsGenerating(true);

    // Animate generation
    setTimeout(() => {
      const numbers = [];
      const pool = [];

      if (allowDuplicates) {
        // Generate with duplicates allowed
        for (let i = 0; i < countVal; i++) {
          const num = Math.floor(Math.random() * (maxVal - minVal + 1)) + minVal;
          numbers.push(num);
        }
      } else {
        // Generate without duplicates
        for (let i = minVal; i <= maxVal; i++) {
          pool.push(i);
        }

        // Fisher-Yates shuffle
        for (let i = pool.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [pool[i], pool[j]] = [pool[j], pool[i]];
        }

        numbers.push(...pool.slice(0, countVal));
      }

      // Sort if not allowing duplicates (looks cleaner)
      if (!allowDuplicates) {
        numbers.sort((a, b) => a - b);
      }

      setGenerated(numbers);

      // Add to history
      const newEntry = {
        numbers,
        min: minVal,
        max: maxVal,
        count: countVal,
        timestamp: Date.now()
      };

      const newHistory = [newEntry, ...history].slice(0, 20);
      setHistory(newHistory);
      saveSettings({ history: newHistory });

      setIsGenerating(false);
    }, 300);
  };

  const handleMinChange = (e) => {
    const val = parseInt(e.target.value);
    setMin(val);
    saveSettings({ min: val });
  };

  const handleMaxChange = (e) => {
    const val = parseInt(e.target.value);
    setMax(val);
    saveSettings({ max: val });
  };

  const handleCountChange = (e) => {
    const val = parseInt(e.target.value);
    setCount(val);
    saveSettings({ count: val });
  };

  const handleDuplicatesToggle = () => {
    const newVal = !allowDuplicates;
    setAllowDuplicates(newVal);
    saveSettings({ allowDuplicates: newVal });
  };

  const clearHistory = () => {
    setHistory([]);
    saveSettings({ history: [] });
  };

  const copyNumbers = (numbers) => {
    navigator.clipboard.writeText(numbers.join(', '));
  };

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  return h(Modal, {
    title: '🎲 Random Number Generator',
    onClose: () => closeUtility('randomGen'),
    defaultWidth: 420,
    defaultHeight: 580,
    defaultX: window.innerWidth / 2 - 210,
    defaultY: 80
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
    // Settings Section
    h('div', {
      style: {
        display: 'flex',
        flexDirection: 'column',
        gap: SPACING.md,
        padding: SPACING.md,
        background: COLORS.bg.darker,
        borderRadius: BORDER_RADIUS.md,
        border: `1px solid ${COLORS.border.default}`
      }
    }, [
      // Range inputs
      h('div', {
        style: {
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: SPACING.md
        }
      }, [
        h('div', {}, [
          h('label', {
            style: {
              display: 'block',
              marginBottom: '6px',
              fontSize: '11px',
              color: COLORS.text.secondary,
              fontWeight: '500'
            }
          }, 'Min'),
          h('input', {
            type: 'number',
            value: min,
            onInput: handleMinChange,
            style: {
              width: '100%',
              padding: '8px 10px',
              background: COLORS.bg.darkest,
              border: `1px solid ${COLORS.border.default}`,
              borderRadius: BORDER_RADIUS.sm,
              color: COLORS.text.primary,
              fontSize: '13px',
              outline: 'none'
            }
          })
        ]),
        h('div', {}, [
          h('label', {
            style: {
              display: 'block',
              marginBottom: '6px',
              fontSize: '11px',
              color: COLORS.text.secondary,
              fontWeight: '500'
            }
          }, 'Max'),
          h('input', {
            type: 'number',
            value: max,
            onInput: handleMaxChange,
            style: {
              width: '100%',
              padding: '8px 10px',
              background: COLORS.bg.darkest,
              border: `1px solid ${COLORS.border.default}`,
              borderRadius: BORDER_RADIUS.sm,
              color: COLORS.text.primary,
              fontSize: '13px',
              outline: 'none'
            }
          })
        ])
      ]),

      // Count input
      h('div', {}, [
        h('label', {
          style: {
            display: 'block',
            marginBottom: '6px',
            fontSize: '11px',
            color: COLORS.text.secondary,
            fontWeight: '500'
          }
        }, 'How many numbers?'),
        h('input', {
          type: 'number',
          value: count,
          min: 1,
          max: 100,
          onInput: handleCountChange,
          style: {
            width: '100%',
            padding: '8px 10px',
            background: COLORS.bg.darkest,
            border: `1px solid ${COLORS.border.default}`,
            borderRadius: BORDER_RADIUS.sm,
            color: COLORS.text.primary,
            fontSize: '13px',
            outline: 'none'
          }
        })
      ]),

      // Allow duplicates toggle
      h(ToggleSwitch, {
        label: 'Allow duplicate numbers',
        checked: allowDuplicates,
        onChange: handleDuplicatesToggle
      })
    ]),

    // Generate Button
    h('button', {
      onClick: generateNumbers,
      disabled: isGenerating,
      style: {
        padding: '12px 20px',
        background: isGenerating ? COLORS.bg.darkest : COLORS.accent.info,
        color: COLORS.text.primary,
        border: 'none',
        borderRadius: BORDER_RADIUS.md,
        fontSize: '14px',
        fontWeight: '600',
        cursor: isGenerating ? 'not-allowed' : 'pointer',
        transition: 'all 0.2s',
        opacity: isGenerating ? 0.6 : 1
      }
    }, isGenerating ? 'Generating...' : '🎲 Generate Numbers'),

    // Generated Numbers Display
    generated.length > 0 && h('div', {
      style: {
        padding: SPACING.md,
        background: COLORS.bg.darker,
        borderRadius: BORDER_RADIUS.md,
        border: `2px solid ${COLORS.accent.success}`,
        animation: 'fadeIn 0.3s ease'
      }
    }, [
      h('div', {
        style: {
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: SPACING.sm
        }
      }, [
        h('span', {
          style: {
            fontSize: '11px',
            color: COLORS.text.secondary,
            fontWeight: '500'
          }
        }, 'Your Numbers'),
        h('button', {
          onClick: () => copyNumbers(generated),
          style: {
            padding: '4px 8px',
            background: 'transparent',
            color: COLORS.accent.info,
            border: `1px solid ${COLORS.accent.info}`,
            borderRadius: BORDER_RADIUS.sm,
            fontSize: '10px',
            cursor: 'pointer',
            transition: 'all 0.2s'
          }
        }, '📋 Copy')
      ]),
      h('div', {
        style: {
          display: 'flex',
          flexWrap: 'wrap',
          gap: '8px',
          justifyContent: 'center'
        }
      }, generated.map(num => h('div', {
        style: {
          padding: '10px 14px',
          background: COLORS.accent.success,
          color: COLORS.text.primary,
          borderRadius: BORDER_RADIUS.md,
          fontSize: '16px',
          fontWeight: '700',
          minWidth: '45px',
          textAlign: 'center',
          boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
        }
      }, num)))
    ]),

    // History Section
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
          maxHeight: '240px',
          overflowY: 'auto'
        }
      }, history.length === 0 ? h('div', {
        style: {
          padding: SPACING.lg,
          textAlign: 'center',
          color: COLORS.text.tertiary,
          fontSize: '12px'
        }
      }, 'No history yet. Generate some numbers!') : history.map((entry, idx) => h('div', {
        key: idx,
        style: {
          padding: SPACING.sm,
          background: COLORS.bg.darker,
          borderRadius: BORDER_RADIUS.sm,
          border: `1px solid ${COLORS.border.default}`,
          fontSize: '11px'
        }
      }, [
        h('div', {
          style: {
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '6px'
          }
        }, [
          h('span', {
            style: { color: COLORS.text.tertiary }
          }, `${entry.min}-${entry.max} (${entry.count})`),
          h('span', {
            style: { color: COLORS.text.tertiary, fontSize: '10px' }
          }, formatDate(entry.timestamp))
        ]),
        h('div', {
          style: {
            display: 'flex',
            flexWrap: 'wrap',
            gap: '4px'
          }
        }, entry.numbers.map(num => h('span', {
          style: {
            padding: '3px 7px',
            background: COLORS.bg.darkest,
            borderRadius: BORDER_RADIUS.sm,
            color: COLORS.text.primary,
            fontSize: '11px',
            fontWeight: '600'
          }
        }, num)))
      ])))
    ])
  ]));
}
