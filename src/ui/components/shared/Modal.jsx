// src/ui/components/shared/Modal.jsx
// Reusable modal/window component with dragging and optional resizing

import { useState, useEffect, useRef } from 'preact/hooks';

/**
 * Modal Component
 * 
 * Reusable modal window with:
 * - Draggable header
 * - Close button
 * - Optional resize
 * - Consistent styling
 * - Customizable header content
 * 
 * @param {Object} props
 * @param {string} props.title - Modal title text
 * @param {string} props.icon - Emoji icon for the modal
 * @param {Function} props.onClose - Close handler
 * @param {preact.ComponentChildren} props.children - Modal content
 * @param {preact.ComponentChildren} props.headerExtra - Optional extra content in header (right side before close button)
 * @param {Object} props.defaultPosition - Initial position {x, y}
 * @param {Object} props.defaultSize - Initial size {width, height}
 * @param {boolean} props.resizable - Enable resize handle (default: true)
 * @param {string} props.zIndex - CSS z-index value (default: '10002')
 */
export function Modal({
  title,
  icon,
  onClose,
  children,
  headerExtra,
  defaultPosition = { x: window.innerWidth - 520, y: 100 },
  defaultSize = { width: 500, height: 650 },
  resizable = true,
  zIndex = '10002'
}) {
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState(defaultPosition);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  
  const windowRef = useRef(null);
  const headerRef = useRef(null);

  // Handle dragging
  const handleMouseDown = (e) => {
    if (e.target.closest('input') || e.target.closest('button') || e.target.closest('select')) return;
    setIsDragging(true);
    setDragOffset({
      x: e.clientX - position.x,
      y: e.clientY - position.y
    });
  };

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isDragging) return;
      setPosition({
        x: e.clientX - dragOffset.x,
        y: e.clientY - dragOffset.y
      });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, dragOffset]);

  return (
    <div
      ref={windowRef}
      style={{
        position: 'fixed',
        left: `${position.x}px`,
        top: `${position.y}px`,
        width: `${defaultSize.width}px`,
        minWidth: '400px',
        height: `${defaultSize.height}px`,
        minHeight: '400px',
        background: 'linear-gradient(135deg, #0f212e 0%, #1a2c38 100%)',
        border: '2px solid #2a3f4f',
        borderRadius: '12px',
        boxShadow: '0 10px 40px rgba(0,0,0,0.5)',
        zIndex: zIndex,
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
        overflow: 'hidden',
        resize: resizable ? 'both' : 'none'
      }}
    >
      {/* Header */}
      <div
        ref={headerRef}
        onMouseDown={handleMouseDown}
        style={{
          background: 'linear-gradient(90deg, #1a2c38 0%, #2a3f4f 100%)',
          padding: '12px 16px',
          cursor: isDragging ? 'grabbing' : 'move',
          borderBottom: '2px solid #3a5f6f',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          userSelect: 'none'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {icon && <span style={{ fontSize: '18px' }}>{icon}</span>}
          <span style={{ color: '#74b9ff', fontWeight: 700, fontSize: '14px' }}>{title}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {headerExtra}
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: '#ff7675',
              cursor: 'pointer',
              fontSize: '18px',
              lineHeight: 1,
              padding: 0
            }}
          >
            ✕
          </button>
        </div>
      </div>

      {/* Content */}
      <div style={{
        padding: '16px',
        height: 'calc(100% - 50px)',
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px'
      }}>
        {children}
      </div>
    </div>
  );
}
