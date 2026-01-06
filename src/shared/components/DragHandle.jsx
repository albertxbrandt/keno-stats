// src/ui/components/shared/DragHandle.jsx
// Draggable header bar for the overlay

import { useRef } from 'preact/hooks';
import { Settings, X } from 'lucide-preact';
import { COLORS } from '@/shared/constants/colors.js';

/**
 * DragHandle Component
 * 
 * Top bar with title, status indicator, settings icon, and close button
 * Provides drag functionality for the parent overlay
 * 
 * Features:
 * - Draggable functionality ✅
 * - Status indicator (green = tracking active)
 * - Settings icon
 * - Close button
 * 
 * @component
 * @param {Object} props
 * @param {string} props.title - Title text to display
 * @param {Function} props.onClose - Called when close button clicked
 * @param {Function} props.onSettingsClick - Called when settings icon clicked
 * @param {Function} props.onDragStart - Called when drag starts
 * @param {Function} props.onDrag - Called during drag with (dx, dy)
 * @param {Function} props.onDragEnd - Called when drag ends
 * @param {boolean} props.isActive - Status indicator color
 * @returns {preact.VNode} The rendered drag handle
 */
export function DragHandle({ title = 'Stats Tracker', onClose, onSettingsClick, onDragStart, onDrag, onDragEnd, isActive = false }) {
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
        background: COLORS.bg.darkest,
        padding: '8px 12px',
        borderTopLeftRadius: '8px',
        borderTopRightRadius: '8px'
      }}
    >
      <div style={{ 
        display: 'flex', 
        alignItems: 'center',
        gap: '8px',
        pointerEvents: 'none'
      }}>
        <span 
          id="tracker-status"
          title="Tracker Active"
          style={{ 
            display: 'inline-block',
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            backgroundColor: isActive ? '#22c55e' : '#ef4444',
            boxShadow: isActive ? '0 0 6px rgba(34, 197, 94, 0.6)' : '0 0 6px rgba(239, 68, 68, 0.6)'
          }}
        />
        <h3 style={{ 
          margin: 0, 
          color: '#fff', 
          fontWeight: '600',
          fontSize: '13px',
          letterSpacing: '0.01em',
          lineHeight: '1'
        }}>
          {title}
        </h3>
      </div>
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
        <span 
          id="settings-icon"
          onClick={onSettingsClick}
          style={{ 
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            opacity: 0.7,
            transition: 'opacity 0.2s'
          }}
          onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
          onMouseLeave={(e) => e.currentTarget.style.opacity = '0.7'}
          title="Settings"
        >
          <Settings size={14} strokeWidth={2} color="#fff" />
        </span>
        <span 
          onClick={onClose}
          style={{ 
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            opacity: 0.7,
            transition: 'opacity 0.2s'
          }}
          onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
          onMouseLeave={(e) => e.currentTarget.style.opacity = '0.7'}
          title="Close"
        >
          <X size={14} strokeWidth={2} color="#fff" />
        </span>
      </div>
    </div>
  );
}