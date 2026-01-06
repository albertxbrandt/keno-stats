// src/shared/components/Modal.tsx
// Reusable modal/window component with dragging and optional resizing

import { useState, useEffect, useRef } from "preact/hooks";
import type { ComponentChildren, FunctionComponent } from "preact";
import { COLORS } from "@/shared/constants/colors.js";
import { BORDER_RADIUS, SPACING } from "@/shared/constants/styles.js";
import { constrainToViewport } from "@/shared/utils/viewport.js";

interface ModalProps {
  /** Modal title text */
  title: string;
  /** Icon for the modal (emoji string or Lucide icon element) */
  icon?: string | ComponentChildren;
  /** Close handler */
  onClose: () => void;
  /** Modal content */
  children: ComponentChildren;
  /** Optional extra content in header (right side before close button) */
  headerExtra?: ComponentChildren;
  /** Initial position {x, y} */
  defaultPosition?: { x: number; y: number };
  /** Initial size {width, height} */
  defaultSize?: { width: number; height: number };
  /** Enable resize handle (default: true) */
  resizable?: boolean;
  /** CSS z-index value (default: '10002') */
  zIndex?: string;
}

/**
 * Modal Component
 *
 * Reusable modal window with:
 * - Draggable header
 * - Close button
 * - Optional resize
 * - Consistent styling
 * - Customizable header content
 * - Support for both emoji strings and Lucide icon elements
 */
export const Modal: FunctionComponent<ModalProps> = ({
  title,
  icon,
  onClose,
  children,
  headerExtra,
  defaultPosition = { x: window.innerWidth - 520, y: 100 },
  defaultSize = { width: 500, height: 650 },
  resizable = true,
  zIndex = "10002",
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState(defaultPosition);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  const windowRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);

  // Handle dragging
  const handleMouseDown = (e: MouseEvent) => {
    const target = e.target as HTMLElement;
    if (
      target.closest("input") ||
      target.closest("button") ||
      target.closest("select")
    )
      return;
    setIsDragging(true);
    setDragOffset({
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    });
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const newX = e.clientX - dragOffset.x;
      const newY = e.clientY - dragOffset.y;
      const constrained = constrainToViewport(newX, newY, defaultSize.width);
      setPosition(constrained);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      return () => {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
      };
    }
    return undefined;
  }, [isDragging, dragOffset, defaultSize.width, position.x, position.y]);

  return (
    <div
      ref={windowRef}
      style={{
        position: "fixed",
        left: `${position.x}px`,
        top: `${position.y}px`,
        width: `${defaultSize.width}px`,
        minWidth: "400px",
        height: `${defaultSize.height}px`,
        minHeight: "400px",
        background: `linear-gradient(135deg, ${COLORS.bg.dark} 0%, ${COLORS.bg.darker} 100%)`,
        border: "1px solid #1a2c38",
        borderRadius: BORDER_RADIUS.lg,
        boxShadow: "0 10px 40px rgba(0,0,0,0.5)",
        zIndex: zIndex,
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
        overflow: "hidden",
        resize: resizable ? "both" : "none",
      }}
    >
      {/* Header */}
      <div
        ref={headerRef}
        onMouseDown={handleMouseDown}
        style={{
          background: COLORS.bg.darkest,
          padding: SPACING.md,
          cursor: isDragging ? "grabbing" : "move",
          borderBottom: "1px solid #1a2c38",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          userSelect: "none",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          {icon && (
            <span
              style={{
                display: "flex",
                alignItems: "center",
                opacity: 0.9,
                flexShrink: 0,
              }}
            >
              {icon}
            </span>
          )}
          <span
            style={{
              color: "#fff",
              fontWeight: 600,
              fontSize: "14px",
              letterSpacing: "0.01em",
            }}
          >
            {title}
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          {headerExtra}
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              color: COLORS.accent.error,
              cursor: "pointer",
              fontSize: "18px",
              lineHeight: 1,
              padding: 0,
            }}
          >
            ✕
          </button>
        </div>
      </div>

      {/* Content */}
      <div
        style={{
          padding: "16px",
          height: "calc(100% - 50px)",
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
          gap: "12px",
        }}
      >
        {children}
      </div>
    </div>
  );
};
