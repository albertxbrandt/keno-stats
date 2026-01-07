/**
 * ToolbarButton Component
 * Reusable button for toolbar menu items
 */

import { COLORS } from "@/shared/constants/colors.js";
import { FONT_SIZES, BORDER_RADIUS } from "@/shared/constants/styles.js";
import { ComponentChildren } from "preact";

interface ToolbarButtonProps {
  icon: ComponentChildren;
  label: string;
  subtitle?: string;
  onClick: () => void;
}

export function ToolbarButton({
  icon,
  label,
  subtitle,
  onClick,
}: ToolbarButtonProps) {
  return (
    <button
      onClick={onClick}
      style={{
        width: "100%",
        background: "transparent",
        border: "none",
        color: COLORS.text.primary,
        cursor: "pointer",
        padding: "10px 12px",
        textAlign: "left",
        display: "flex",
        alignItems: "center",
        gap: "12px",
        borderRadius: BORDER_RADIUS.md,
        transition: "background 0.15s ease",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = COLORS.bg.darker;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = "transparent";
      }}
    >
      <span style={{ display: "flex", alignItems: "center", flexShrink: 0 }}>
        {icon}
      </span>
      <div style={{ flex: 1 }}>
        <div
          style={{
            fontSize: FONT_SIZES.md,
            fontWeight: "600",
            color: "rgba(255, 255, 255, 0.92)",
          }}
        >
          {label}
        </div>
        {subtitle && (
          <div
            style={{
              fontSize: FONT_SIZES.xs,
              color: COLORS.text.secondary,
              fontStyle: "italic",
            }}
          >
            {subtitle}
          </div>
        )}
      </div>
    </button>
  );
}
