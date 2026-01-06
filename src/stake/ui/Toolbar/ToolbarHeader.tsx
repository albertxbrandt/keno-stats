/**
 * ToolbarHeader Component
 * Draggable header with title and collapse button
 */

import { COLORS } from "@/shared/constants/colors.js";
import { SPACING, FONT_SIZES, BORDER_RADIUS } from "@/shared/constants/styles.js";
import { Dices } from "lucide-preact";

interface ToolbarHeaderProps {
  collapsed: boolean;
  onToggleCollapsed: () => void;
  onMouseDown: (e: MouseEvent | TouchEvent) => void;
}

export function ToolbarHeader({
  collapsed,
  onToggleCollapsed,
  onMouseDown,
}: ToolbarHeaderProps) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: SPACING.md,
        background: COLORS.bg.darkest,
        borderTopLeftRadius: BORDER_RADIUS.lg,
        borderTopRightRadius: BORDER_RADIUS.lg,
        borderBottom: "1px solid #1a2c38",
      }}
      onMouseDown={onMouseDown as (e: unknown) => void}
    >
      {!collapsed && (
        <div
          style={{
            fontWeight: "600",
            color: "#fff",
            fontSize: FONT_SIZES.md,
            display: "flex",
            alignItems: "center",
            gap: "10px",
            letterSpacing: "0.01em",
          }}
        >
          <Dices size={18} strokeWidth={2} style={{ opacity: 0.9 }} />
          Stake Tools
        </div>
      )}
      {collapsed && (
        <div style={{ display: "flex", alignItems: "center" }}>
          <Dices
            size={18}
            strokeWidth={2}
            style={{ opacity: 0.9, color: "#fff" }}
          />
        </div>
      )}
      <button
        onClick={onToggleCollapsed}
        style={{
          background: "transparent",
          border: "none",
          color: COLORS.text.secondary,
          cursor: "pointer",
          fontSize: FONT_SIZES.xl,
          padding: "4px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
        title={collapsed ? "Expand" : "Collapse"}
      >
        {collapsed ? "▶" : "◀"}
      </button>
    </div>
  );
}
