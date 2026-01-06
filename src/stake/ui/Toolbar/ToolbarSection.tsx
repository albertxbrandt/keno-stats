/**
 * ToolbarSection Component
 * Section container with title
 */

import { COLORS } from "@/shared/constants/colors.js";
import { FONT_SIZES } from "@/shared/constants/styles.js";
import { ComponentChildren } from "preact";

interface ToolbarSectionProps {
  title: string;
  children: ComponentChildren;
  showTopBorder?: boolean;
}

export function ToolbarSection({
  title,
  children,
  showTopBorder = false,
}: ToolbarSectionProps) {
  return (
    <>
      <div
        style={{
          fontSize: FONT_SIZES.sm,
          fontWeight: "600",
          color: COLORS.text.tertiary,
          marginBottom: "8px",
          marginTop: showTopBorder ? "12px" : "4px",
          paddingTop: showTopBorder ? "12px" : "0",
          borderTop: showTopBorder
            ? "1px solid rgba(255, 255, 255, 0.08)"
            : "none",
          textTransform: "uppercase",
          letterSpacing: "0.05em",
        }}
      >
        {title}
      </div>
      {children}
    </>
  );
}
