// src/ui/components/shared/DragHandle.jsx
// Draggable header bar for the overlay

/**
 * DragHandle Component
 * 
 * Top bar with title, status indicator, settings icon, and close button
 * 
 * Features:
 * - Draggable functionality (TODO: implement)
 * - Status indicator (active/inactive)
 * - Settings icon (TODO: wire up settings tab)
 * - Close button
 * 
 * @component
 * @param {Object} props
 * @param {Function} props.onClose - Called when close button clicked
 * @param {Function} props.onSettingsClick - Called when settings icon clicked
 * @param {boolean} props.isActive - Status indicator color
 * @returns {preact.VNode} The rendered drag handle
 */
export function DragHandle({ onClose, onSettingsClick, isActive = false }) {
  return (
    <div 
      id="drag-handle"
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
