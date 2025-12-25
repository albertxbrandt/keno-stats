// src/ui/components/shared/CollapsibleSection.jsx
// Reusable collapsible section with header and expandable content
// Handles hover/pin functionality and smooth transitions

import { useState } from 'preact/hooks';
import { COLORS } from '@/shared/constants/colors';
import { BORDER_RADIUS, SPACING } from '@/shared/constants/styles.js';

/**
 * CollapsibleSection Component
 * 
 * A section with a clickable header that expands/collapses content.
 * Supports two interaction modes:
 * 1. Hover mode - content shows on mouseenter, hides on mouseleave
 * 2. Pin mode - clicking header toggles pinned state (ignores hover)
 * 
 * @component
 * @param {Object} props
 * @param {string} props.title - Section title text
 * @param {string} [props.icon] - Optional emoji/icon to display before title
 * @param {preact.VNode} props.children - Content to show when expanded
 * @param {string} [props.dataSection] - data-section attribute for settings persistence
 * @param {string} [props.titleColor] - Color of the title text (defaults to COLORS.text.primary)
 * @param {string} [props.maxHeight='200px'] - Maximum height when expanded
 * @param {boolean} [props.defaultExpanded=false] - Whether to start expanded
 * @param {boolean} [props.pinnable=true] - Whether clicking header toggles pinned state
 * @param {preact.VNode} [props.headerActions] - Optional additional header elements (e.g., buttons)
 * 
 * @example
 * <CollapsibleSection 
 *   title="Profit/Loss" 
 *   icon="💰"
 *   dataSection="profitLoss"
 *   maxHeight="150px"
 * >
 *   <div>Profit content here</div>
 * </CollapsibleSection>
 */
export function CollapsibleSection({
  title,
  icon,
  children,
  dataSection,
  titleColor = COLORS.text.primary,
  maxHeight = '200px',
  defaultExpanded = false,
  pinnable = true,
  headerActions
}) {
  const [isPinned, setIsPinned] = useState(defaultExpanded);
  const [isHovering, setIsHovering] = useState(false);

  const isExpanded = pinnable ? (isPinned || isHovering) : isPinned;

  const handleHeaderClick = (e) => {
    // Don't toggle if clicking on header actions (buttons, etc.)
    if (e.target.closest('button') || e.target.closest('select') || e.target.closest('input')) {
      return;
    }

    if (pinnable) {
      setIsPinned(!isPinned);
    }
  };

  const handleMouseEnter = () => {
    if (!isPinned && pinnable) {
      setIsHovering(true);
    }
  };

  const handleMouseLeave = () => {
    if (!isPinned && pinnable) {
      setIsHovering(false);
    }
  };

  const headerBgColor = isPinned ? COLORS.bg.darker : 'transparent';

  return (
    <div 
      data-section={dataSection}
      style={{
        marginBottom: SPACING.lg,
        background: COLORS.bg.dark,
        padding: SPACING.sm,
        borderRadius: BORDER_RADIUS.sm,
        cursor: pinnable ? 'pointer' : 'default'
      }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div 
        onClick={handleHeaderClick}
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: headerBgColor,
          transition: 'background-color 0.3s',
          padding: '4px 0'
        }}
      >
        <span style={{ color: titleColor, fontWeight: 'bold', fontSize: '12px' }}>
          {icon && <>{icon} </>}{title}
        </span>
        {headerActions}
      </div>
      
      <div style={{
        maxHeight: isExpanded ? maxHeight : '0',
        overflow: 'hidden',
        transition: 'max-height 0.5s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.5s ease',
        opacity: isExpanded ? '1' : '0'
      }}>
        {children}
      </div>
    </div>
  );
}
