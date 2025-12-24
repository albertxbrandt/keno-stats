// src/dashboard/components/Pagination.jsx
import { COLORS } from '@/shared/constants/colors.js';
import { BORDER_RADIUS, SPACING } from '@/shared/constants/styles.js';

/**
 * Pagination Component
 * Navigation controls for paginated table
 */
export function Pagination({ currentPage, totalPages, onPageChange }) {
  const canGoPrev = currentPage > 1;
  const canGoNext = currentPage < totalPages;

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      gap: SPACING.md,
      marginTop: SPACING.lg
    }}>
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={!canGoPrev}
        style={{
          background: canGoPrev ? COLORS.bg.darker : COLORS.bg.darkest,
          color: canGoPrev ? COLORS.text.primary : COLORS.text.disabled,
          border: 'none',
          padding: `${SPACING.sm} ${SPACING.md}`,
          borderRadius: BORDER_RADIUS.md,
          cursor: canGoPrev ? 'pointer' : 'not-allowed',
          fontSize: '14px'
        }}
      >
        ← Previous
      </button>

      <span style={{ color: COLORS.text.secondary, fontSize: '14px' }}>
        Page {currentPage} of {totalPages || 1}
      </span>

      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={!canGoNext}
        style={{
          background: canGoNext ? COLORS.bg.darker : COLORS.bg.darkest,
          color: canGoNext ? COLORS.text.primary : COLORS.text.disabled,
          border: 'none',
          padding: `${SPACING.sm} ${SPACING.md}`,
          borderRadius: BORDER_RADIUS.md,
          cursor: canGoNext ? 'pointer' : 'not-allowed',
          fontSize: '14px'
        }}
      >
        Next →
      </button>
    </div>
  );
}
