// src/dashboard/components/SearchBar.jsx
import { COLORS } from '@/shared/constants/colors';
import { BORDER_RADIUS, SPACING } from '@/shared/constants/styles.js';

/**
 * SearchBar Component
 * Search input for filtering bet history with field-specific search support
 */
export function SearchBar({ value, onChange }) {
  return (
    <div style={{ marginBottom: SPACING.lg }}>
      <input
        type="text"
        placeholder="Search: text or field:value (e.g., amount:100 currency:gold risk:high)"
        value={value}
        onInput={(e) => onChange(e.target.value)}
        style={{
          width: '100%',
          padding: SPACING.md,
          borderRadius: BORDER_RADIUS.md,
          border: `1px solid ${COLORS.border.default}`,
          fontSize: '14px',
          background: COLORS.bg.darker,
          color: COLORS.text.primary,
          boxSizing: 'border-box'
        }}
      />
    </div>
  );
}
