/**
 * DraggableOverlay Component
 * Shared draggable overlay container with consistent behavior
 *
 * Manages:
 * - Position state (top, left positioning)
 * - Drag functionality via DragHandle
 * - Active/inactive state
 * - Custom title and icon
 */

import { ComponentChildren, VNode } from "preact";
import { useState } from "preact/hooks";
import { DragHandle } from "./DragHandle";
import { COLORS } from "@/shared/constants/colors.js";
import { FONT_SIZES } from "@/shared/constants/styles.js";

interface Position {
  x: number;
  y: number;
}

interface DraggableOverlayProps {
  /** Overlay title */
  title: string;
  /** Optional icon for title */
  icon?: VNode;
  /** Called when close button clicked */
  onClose: () => void;
  /** Optional settings handler */
  onSettingsClick?: () => void;
  /** Show active indicator (default: true) */
  isActive?: boolean;
  /** Initial position { x, y } (default: { x: window.innerWidth - 340, y: 100 }) */
  defaultPosition?: Position;
  /** Overlay width (default: '320px') */
  width?: string;
  /** Z-index (default: 9999999) */
  zIndex?: number;
  /** Overlay content */
  children: ComponentChildren;
}

export function DraggableOverlay({
  title,
  icon,
  onClose,
  onSettingsClick,
  isActive = true,
  defaultPosition,
  width = "320px",
  zIndex = 9999999,
  children,
}: DraggableOverlayProps) {
  // Calculate default position (right side of screen)
  const initialPos: Position = defaultPosition || {
    x: typeof window !== "undefined" ? window.innerWidth - 340 : 20,
    y: 100,
  };

  const [position, setPosition] = useState<Position>(initialPos);
  const [isDragging, setIsDragging] = useState(false);

  const handleDragStart = () => {
    setIsDragging(true);
  };

  const handleDrag = (dx: number, dy: number) => {
    setPosition((prev) => ({
      x: prev.x + dx,
      y: prev.y + dy,
    }));
  };

  const handleDragEnd = () => {
    setIsDragging(false);
  };

  return (
    <div
      style={{
        position: "fixed",
        top: `${position.y}px`,
        left: `${position.x}px`,
        width,
        background: COLORS.bg.darker,
        border: `1px solid ${COLORS.border.default}`,
        borderRadius: "8px",
        boxShadow: "0 8px 32px rgba(0, 0, 0, 0.4)",
        zIndex,
        cursor: isDragging ? "grabbing" : "default",
        fontFamily:
          'system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial',
        fontSize: FONT_SIZES.base,
        color: "#fff",
      }}
    >
      {/* Header with Drag Handle */}
      <DragHandle
        title={title}
        icon={icon as any}
        onClose={onClose}
        onSettingsClick={onSettingsClick as any}
        onDragStart={handleDragStart}
        onDrag={handleDrag}
        onDragEnd={handleDragEnd}
        isActive={isActive}
      />

      {/* Content */}
      {children}
    </div>
  );
}
