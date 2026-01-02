/**
 * Site-wide toolbar component
 * Provides quick access to utilities and features across all Stake pages
 */

import { h } from 'preact';
import { useState, useEffect } from 'preact/hooks';
import { state } from '../core/state.js';
import { saveToolbarSettings } from '../core/storage.js';
import { COLORS } from '@/shared/constants/colors.js';
import { SPACING } from '@/shared/constants/styles.js';
import { useUtilities } from '../hooks/useUtilities.js';

/**
 * Main toolbar component
 */
export function Toolbar() {
  const { openUtility } = useUtilities();
  const [position, setPosition] = useState(state.toolbarPosition);
  const [collapsed, setCollapsed] = useState(state.toolbarCollapsed);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  // Save position when it changes
  useEffect(() => {
    state.toolbarPosition = position;
    saveToolbarSettings();
  }, [position]);

  // Save collapsed state when it changes
  useEffect(() => {
    state.toolbarCollapsed = collapsed;
    saveToolbarSettings();
  }, [collapsed]);

  const handleMouseDown = (e) => {
    if (e.target.closest('.toolbar-menu')) return; // Don't drag when clicking menu items
    setIsDragging(true);
    setDragOffset({
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    });
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    setPosition({
      x: e.clientX - dragOffset.x,
      y: e.clientY - dragOffset.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, dragOffset]);

  const toggleCollapsed = () => {
    setCollapsed(!collapsed);
  };

  const handleUtilityClick = (utilityName) => {
    openUtility(utilityName);
  };

  return (
    <div
      class="stake-toolbar"
      style={{
        position: 'fixed',
        left: `${position.x}px`,
        top: `${position.y}px`,
        zIndex: 999999,
        cursor: isDragging ? 'grabbing' : 'grab',
        userSelect: 'none',
      }}
      onMouseDown={handleMouseDown}
    >
      <div
        style={{
          background: COLORS.OVERLAY_BG,
          border: `1px solid ${COLORS.BORDER}`,
          borderRadius: '8px',
          padding: SPACING.SM,
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
          minWidth: collapsed ? '40px' : '200px',
          transition: 'all 0.2s ease',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: collapsed ? '0' : SPACING.SM,
            paddingBottom: collapsed ? '0' : SPACING.XS,
            borderBottom: collapsed ? 'none' : `1px solid ${COLORS.BORDER}`,
          }}
        >
          {!collapsed && (
            <div
              style={{
                fontWeight: 'bold',
                color: COLORS.TEXT_PRIMARY,
                fontSize: '14px',
              }}
            >
              🎲 Stake Tools
            </div>
          )}
          <button
            onClick={toggleCollapsed}
            style={{
              background: 'transparent',
              border: 'none',
              color: COLORS.TEXT_SECONDARY,
              cursor: 'pointer',
              fontSize: '16px',
              padding: '4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            title={collapsed ? 'Expand' : 'Collapse'}
          >
            {collapsed ? '▶' : '◀'}
          </button>
        </div>

        {/* Menu */}
        {!collapsed && (
          <div class="toolbar-menu">
            <ToolbarButton
              icon="🪙"
              label="Coin Flipper"
              onClick={() => handleUtilityClick('coinFlipper')}
            />
            <ToolbarButton
              icon="🔢"
              label="Random Numbers"
              onClick={() => handleUtilityClick('randomGen')}
            />
            <ToolbarButton
              icon="🎮"
              label="Random Game"
              onClick={() => handleUtilityClick('randomGamePicker')}
            />
            <ToolbarButton
              icon="🔮"
              label="Magic 8-Ball"
              onClick={() => handleUtilityClick('magic8Ball')}
            />
            <ToolbarButton
              icon="🔗"
              label="Win Links"
              onClick={() => handleUtilityClick('winLinks')}
              subtitle="Coming soon"
            />
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Individual toolbar button component
 */
function ToolbarButton({ icon, label, subtitle, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        width: '100%',
        background: 'transparent',
        border: 'none',
        color: COLORS.TEXT_PRIMARY,
        cursor: 'pointer',
        padding: SPACING.SM,
        textAlign: 'left',
        display: 'flex',
        alignItems: 'center',
        gap: SPACING.SM,
        borderRadius: '4px',
        transition: 'background 0.15s ease',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = COLORS.HOVER_BG;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = 'transparent';
      }}
    >
      <span style={{ fontSize: '20px' }}>{icon}</span>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: '13px', fontWeight: '500' }}>{label}</div>
        {subtitle && (
          <div
            style={{
              fontSize: '11px',
              color: COLORS.TEXT_SECONDARY,
              fontStyle: 'italic',
            }}
          >
            {subtitle}
          </div>
        )}
      </div>
    </button>
  );
}
