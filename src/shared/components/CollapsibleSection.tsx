// src/ui/components/shared/CollapsibleSection.tsx
// Reusable collapsible section with header and expandable content
// Handles hover/pin functionality and smooth transitions

import { useState } from "preact/hooks";
import { VNode, ComponentChildren } from "preact";
import { COLORS } from "@/shared/constants/colors.js";
import { BORDER_RADIUS, SPACING } from "@/shared/constants/styles.js";

interface CollapsibleSectionProps {
  /** Section title text */
  title: string;
  /** Optional emoji/icon to display before title */
  icon?: VNode | string;
  /** Content to show when expanded */
  children: ComponentChildren;
  /** data-section attribute for settings persistence */
  dataSection?: string;
  /** Color of the title text (defaults to COLORS.text.primary) */
  titleColor?: string;
  /** Maximum height when expanded */
  maxHeight?: string;
  /** Whether to start expanded */
  defaultExpanded?: boolean;
  /** Whether clicking header toggles pinned state */
  pinnable?: boolean;
  /** Optional additional header elements (e.g., buttons) */
  headerActions?: VNode;
}

/**
 * CollapsibleSection Component
 *
 * A section with a clickable header that expands/collapses content.
 * Supports two interaction modes:
 * 1. Hover mode - content shows on mouseenter, hides on mouseleave
 * 2. Pin mode - clicking header toggles pinned state (ignores hover)
 *
 * @component
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
  maxHeight = "200px",
  defaultExpanded = false,
  pinnable = true,
  headerActions,
}: CollapsibleSectionProps) {
  const [isPinned, setIsPinned] = useState(defaultExpanded);
  const [isHovering, setIsHovering] = useState(false);

  const isExpanded = pinnable ? isPinned || isHovering : isPinned;

  const handleHeaderClick = (e: MouseEvent) => {
    // Don't toggle if clicking on header actions (buttons, etc.)
    const target = e.target as HTMLElement;
    if (
      target.closest("button") ||
      target.closest("select") ||
      target.closest("input")
    ) {
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

  const headerBgColor = isPinned ? COLORS.bg.darker : "transparent";

  return (
    <div
      data-section={dataSection}
      style={{
        marginBottom: SPACING.lg,
        background: COLORS.bg.dark,
        padding: SPACING.sm,
        borderRadius: BORDER_RADIUS.sm,
        cursor: pinnable ? "pointer" : "default",
      }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div
        onClick={handleHeaderClick as unknown as (e: MouseEvent) => void}
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          backgroundColor: headerBgColor,
          transition: "background-color 0.3s",
          padding: "4px 0",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            color: titleColor,
            fontWeight: "bold",
            fontSize: "12px",
          }}
        >
          {icon && (
            <span
              style={{
                display: "flex",
                alignItems: "center",
                opacity: 0.7,
                flexShrink: 0,
              }}
            >
              {icon}
            </span>
          )}
          <span>{title}</span>
        </div>
        {headerActions}
      </div>

      <div
        style={{
          maxHeight: isExpanded ? maxHeight : "0",
          overflow: "hidden",
          transition:
            "max-height 0.5s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.5s ease",
          opacity: isExpanded ? "1" : "0",
        }}
      >
        {children}
      </div>
    </div>
  );
}
