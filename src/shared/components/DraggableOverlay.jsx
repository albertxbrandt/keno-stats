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

import { h } from 'preact';
import { useState } from 'preact/hooks';
import { DragHandle } from './DragHandle.jsx';
import { COLORS } from '@/shared/constants/colors.js';

/**
 * @param {Object} props
 * @param {string} props.title - Overlay title
 * @param {preact.VNode} props.icon - Optional icon for title
 * @param {Function} props.onClose - Called when close button clicked
 * @param {Function} props.onSettingsClick - Optional settings handler
 * @param {boolean} props.isActive - Show active indicator (default: true)
 * @param {Object} props.defaultPosition - Initial position { x, y } (default: { x: window.innerWidth - 340, y: 100 })
 * @param {string} props.width - Overlay width (default: '320px')
 * @param {number} props.zIndex - Z-index (default: 9999999)
 * @param {preact.ComponentChildren} props.children - Overlay content
 */
export function DraggableOverlay({
  title,
  icon,
  onClose,
  onSettingsClick,
  isActive = true,
  defaultPosition,
  width = '320px',
  zIndex = 9999999,
  children,
}) {
  // Calculate default position (right side of screen)
  const initialPos = defaultPosition || {
    x: typeof window !== 'undefined' ? window.innerWidth - 340 : 20,
    y: 100,
  };

  const [position, setPosition] = useState(initialPos);
  const [isDragging, setIsDragging] = useState(false);

  const handleDragStart = () => {
    setIsDragging(true);
  };

  const handleDrag = (dx, dy) => {
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
        position: 'fixed',
        top: `${position.y}px`,
        left: `${position.x}px`,
        width,
        background: COLORS.bg.darker,
        border: `1px solid ${COLORS.border.default}`,
        borderRadius: '8px',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
        zIndex,
        cursor: isDragging ? 'grabbing' : 'default',
      }}
    >
      {/* Header with Drag Handle */}
      <DragHandle
        title={title}
        icon={icon}
        onClose={onClose}
        onSettingsClick={onSettingsClick}
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
