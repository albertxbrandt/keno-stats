// src/dashboard/components/SettingsModal.jsx
import { X } from 'lucide-preact';
import { Button } from '@/shared/components/Button.jsx';
import { COLORS } from '@/shared/constants/colors.js';
import { BORDER_RADIUS, SPACING } from '@/shared/constants/styles.js';

/**
 * SettingsModal Component
 * Modal for configuring column visibility
 */
export function SettingsModal({ columnVisibility, onColumnVisibilityChange, onClose }) {
  const columns = [
    { key: 'date', label: 'Date' },
    { key: 'amount', label: 'Amount' },
    { key: 'payout', label: 'Payout' },
    { key: 'multiplier', label: 'Multiplier' },
    { key: 'currency', label: 'Currency' },
    { key: 'risk', label: 'Risk' },
    { key: 'hits', label: 'Hits' },
    { key: 'misses', label: 'Misses' }
  ];

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0,0,0,0.7)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: COLORS.bg.darker,
          padding: SPACING.xl,
          borderRadius: BORDER_RADIUS.lg,
          maxWidth: '400px',
          width: '90%',
          boxShadow: '0 4px 20px rgba(0,0,0,0.5)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 style={{
          margin: `0 0 ${SPACING.lg} 0`,
          color: COLORS.text.primary,
          fontSize: '1.2em'
        }}>
          Column Visibility
        </h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: SPACING.md }}>
          {columns.map(col => (
            <label
              key={col.key}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: SPACING.sm,
                cursor: 'pointer',
                color: COLORS.text.primary
              }}
            >
              <input
                type="checkbox"
                checked={columnVisibility[col.key]}
                onChange={(e) => onColumnVisibilityChange(col.key, e.target.checked)}
                style={{ cursor: 'pointer' }}
              />
              {col.label}
            </label>
          ))}
        </div>

        <Button
          variant="secondary"
          size="md"
          fullWidth
          onClick={onClose}
          style={{ marginTop: SPACING.lg }}
        >
          Close
        </Button>
      </div>
    </div>
  );
}
