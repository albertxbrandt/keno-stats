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
import { Dices, Coins, Hash, Gamepad2, Sparkles, Link } from 'lucide-preact';
import { constrainToViewport } from '@/shared/utils/viewport.js';

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
    const newX = e.clientX - dragOffset.x;
    const newY = e.clientY - dragOffset.y;
    const toolbarWidth = collapsed ? 40 : 200;
    const constrained = constrainToViewport(newX, newY, toolbarWidth);
    setPosition(constrained);
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
          background: COLORS.bg.darker,
          border: '1px solid #1a2c38',
          borderRadius: '8px',
          padding: '0',
          boxShadow: '0 4px 10px rgba(0,0,0,0.5)',
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
            padding: SPACING.md,
            background: COLORS.bg.darkest,
            borderTopLeftRadius: '8px',
            borderTopRightRadius: '8px',
            borderBottom: '1px solid #1a2c38',
          }}
        >
          {!collapsed && (
            <div
              style={{
                fontWeight: '600',
                color: '#fff',
                fontSize: '14px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                letterSpacing: '0.01em'
              }}
            >
              <Dices size={18} strokeWidth={2} style={{ opacity: 0.9 }} />
              Stake Tools
            </div>
          )}
          {collapsed && (
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <Dices size={18} strokeWidth={2} style={{ opacity: 0.9, color: '#fff' }} />
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
          <div class="toolbar-menu" style={{ 
            padding: SPACING.sm,
            background: COLORS.bg.dark
          }}>
            {/* Games Section */}
            <div style={{ 
              fontSize: '12px', 
              fontWeight: '600', 
              color: COLORS.text.tertiary, 
              marginBottom: '8px',
              marginTop: '4px',
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}>
              Games
            </div>
            <ToolbarButton
              icon={<Dices size={18} strokeWidth={2} color={COLORS.text.primary} style={{ opacity: 0.9 }} />}
              label="Keno"
              onClick={() => {
                const currentOrigin = window.location.origin;
                window.location.href = `${currentOrigin}/casino/games/keno`;
              }}
            />
            
            {/* Utilities Section */}
            <div style={{ 
              fontSize: '12px', 
              fontWeight: '600', 
              color: COLORS.text.tertiary, 
              marginBottom: '8px',
              marginTop: '12px',
              paddingTop: '12px',
              borderTop: '1px solid rgba(255, 255, 255, 0.08)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}>
              Utilities
            </div>
            <ToolbarButton
              icon={<Coins size={18} strokeWidth={2} color={COLORS.text.primary} style={{ opacity: 0.9 }} />}
              label="Coin Flipper"
              onClick={() => handleUtilityClick('coinFlipper')}
            />
            <ToolbarButton
              icon={<Hash size={18} strokeWidth={2} color={COLORS.text.primary} style={{ opacity: 0.9 }} />}
              label="Random Numbers"
              onClick={() => handleUtilityClick('randomGen')}
            />
            <ToolbarButton
              icon={<Gamepad2 size={18} strokeWidth={2} color={COLORS.text.primary} style={{ opacity: 0.9 }} />}
              label="Random Game"
              onClick={() => handleUtilityClick('randomGamePicker')}
            />
            <ToolbarButton
              icon={<Sparkles size={18} strokeWidth={2} color={COLORS.text.primary} style={{ opacity: 0.9 }} />}
              label="Magic 8-Ball"
              onClick={() => handleUtilityClick('magic8Ball')}
            />
            <ToolbarButton
              icon={<Link size={18} strokeWidth={2} color={COLORS.text.primary} style={{ opacity: 0.9 }} />}
              label="Win Links"
              onClick={() => handleUtilityClick('winLinks')}
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
        padding: '10px 12px',
        textAlign: 'left',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        borderRadius: '6px',
        transition: 'background 0.15s ease',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = COLORS.bg.darker;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = 'transparent';
      }}
    >
      <span style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>{icon}</span>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: '14px', fontWeight: '600', color: 'rgba(255, 255, 255, 0.92)' }}>{label}</div>
        {subtitle && (
          <div
            style={{
              fontSize: '10px',
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
