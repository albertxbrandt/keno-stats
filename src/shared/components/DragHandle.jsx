// src/ui/components/shared/DragHandle.jsx
// Draggable header bar for the overlay

import { useRef } from 'preact/hooks';

/**
 * DragHandle Component
 * 
 * Top bar with title, status indicator, settings icon, and close button
 * Provides drag functionality for the parent overlay
 * 
 * Features:
 * - Draggable functionality ✅
 * - Status indicator (active/inactive)
 * - Settings icon
 * - Close button
 * 
 * @component
 * @param {Object} props
 * @param {Function} props.onClose - Called when close button clicked
 * @param {Function} props.onSettingsClick - Called when settings icon clicked
 * @param {Function} props.onDragStart - Called when drag starts
 * @param {Function} props.onDrag - Called during drag with (dx, dy)
 * @param {Function} props.onDragEnd - Called when drag ends
 * @param {boolean} props.isActive - Status indicator color
 * @returns {preact.VNode} The rendered drag handle
 */
export function DragHandle({ onClose, onSettingsClick, onDragStart, onDrag, onDragEnd, isActive = false }) {
  const startPosRef = useRef({ x: 0, y: 0 });

  const handleMouseDown = (e) => {
    e.preventDefault();
    startPosRef.current = { x: e.clientX, y: e.clientY };
    
    if (onDragStart) onDragStart();

    const handleMouseMove = (moveEvent) => {
      const dx = moveEvent.clientX - startPosRef.current.x;
      const dy = moveEvent.clientY - startPosRef.current.y;
      if (onDrag) onDrag(dx, dy);
    };

    const handleMouseUp = () => {
      if (onDragEnd) onDragEnd();
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const handleTouchStart = (e) => {
    const touch = e.touches?.[0];
    if (!touch) return;
    
    startPosRef.current = { x: touch.clientX, y: touch.clientY };
    
    if (onDragStart) onDragStart();

    const handleTouchMove = (moveEvent) => {
      const touch = moveEvent.touches?.[0];
      if (!touch) return;
      const dx = touch.clientX - startPosRef.current.x;
      const dy = touch.clientY - startPosRef.current.y;
      if (onDrag) onDrag(dx, dy);
      moveEvent.preventDefault();
    };

    const handleTouchEnd = () => {
      if (onDragEnd) onDragEnd();
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };

    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', handleTouchEnd);
  };
  
  return (
    <div 
      id="drag-handle"
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        cursor: 'move',
        userSelect: 'none',
        background: '#1a2c38',
        padding: '8px 12px',
        borderTopLeftRadius: '8px',
        borderTopRightRadius: '8px'
      }}
    >
      <h3 style={{ margin: 0, color: '#fff', fontWeight: 'bold', pointerEvents: 'none' }}>
        Keno Stats Tracker
      </h3>
      <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
        <span 
          id="settings-icon"
          onClick={onSettingsClick}
          style={{ cursor: 'pointer', fontSize: '16px', color: '#fff' }}
          title="Settings"
        >
          ⚙️
        </span>
        <span 
          id="tracker-status"
          style={{ 
            color: isActive ? '#4ade80' : '#f87171', 
            fontSize: '16px', 
            pointerEvents: 'none' 
          }}
        >
          ●
        </span>
        <span 
          onClick={onClose}
          style={{ cursor: 'pointer', fontWeight: 'bold', color: '#fff', fontSize: '14px' }}
        >
          ✕
        </span>
      </div>
    </div>
  );
}