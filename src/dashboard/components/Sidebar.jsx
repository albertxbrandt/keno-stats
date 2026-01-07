// src/dashboard/components/Sidebar.jsx
// Sidebar navigation for dashboard - supports multiple games and features

import { COLORS } from '@/shared/constants/colors.js';
import { BORDER_RADIUS, SPACING, FONT_SIZES } from '@/shared/constants/styles.js';
import { Dices, TrendingUp, Link, Settings, ChevronLeft, ChevronRight } from 'lucide-preact';

/**
 * Sidebar Component
 * 
 * Navigation sidebar for dashboard with support for multiple games and features
 * 
 * @component
 * @param {Object} props
 * @param {string} props.activeGame - Currently selected game (e.g., 'keno')
 * @param {Function} props.onGameChange - Callback when game selection changes
 * @param {boolean} props.collapsed - Whether sidebar is collapsed
 * @param {Function} props.onToggleCollapse - Callback to toggle collapse state
 * @returns {preact.VNode} The rendered sidebar
 */
export function Sidebar({ 
  activeGame = 'keno', 
  onGameChange,
  activeFeature = null,
  onFeatureChange,
  collapsed = false,
  onToggleCollapse
}) {
  const games = [
    { 
      id: 'keno', 
      label: 'Keno', 
      icon: <Dices size={18} strokeWidth={2} />,
      available: true
    },
    { 
      id: 'dice', 
      label: 'Dice', 
      icon: <Dices size={18} strokeWidth={2} />,
      available: false,
      comingSoon: true
    },
    { 
      id: 'plinko', 
      label: 'Plinko', 
      icon: <TrendingUp size={18} strokeWidth={2} />,
      available: false,
      comingSoon: true
    }
  ];

  const features = [
    { id: 'saved-links', label: 'Saved Win Links', icon: <Link />, available: true },
    { id: 'settings', label: 'Settings', icon: <Settings />, available: false, comingSoon: true }
  ];

  const renderGameItem = (item) => {
    const isActive = activeGame === item.id && !activeFeature;
    
    return (
      <div
        key={item.id}
        onClick={() => item.available && onGameChange?.(item.id)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: collapsed ? '0' : SPACING.sm,
          justifyContent: collapsed ? 'center' : 'flex-start',
          padding: collapsed ? SPACING.sm : `${SPACING.sm} ${SPACING.md}`,
          marginBottom: SPACING.xs,
          background: isActive ? COLORS.bg.darkest : 'transparent',
          color: isActive ? COLORS.accent.info : COLORS.text.secondary,
          borderRadius: BORDER_RADIUS.sm,
          cursor: item.available ? 'pointer' : 'not-allowed',
          opacity: item.available ? 1 : 0.5,
          transition: 'all 0.2s',
          position: 'relative',
          border: `1px solid ${isActive ? COLORS.border.default : 'transparent'}`
        }}
        onMouseEnter={(e) => {
          if (item.available && !isActive) {
            e.currentTarget.style.background = COLORS.bg.darkest;
            e.currentTarget.style.color = COLORS.text.primary;
          }
        }}
        onMouseLeave={(e) => {
          if (!isActive) {
            e.currentTarget.style.background = 'transparent';
            e.currentTarget.style.color = COLORS.text.secondary;
          }
        }}
        title={collapsed ? item.label : ''}
      >
        {item.icon}
        {!collapsed && (
          <>
            <span style={{ 
              fontSize: FONT_SIZES.sm,
              fontWeight: isActive ? '600' : '400',
              flex: 1
            }}>
              {item.label}
            </span>
            {item.comingSoon && (
              <span style={{
                fontSize: FONT_SIZES.xs,
                color: COLORS.accent.warning,
                background: 'rgba(241, 196, 15, 0.1)',
                padding: '2px 6px',
                borderRadius: '3px',
                fontWeight: '600'
              }}>
                Soon
              </span>
            )}
          </>
        )}
      </div>
    );
  };

  const renderFeatureItem = (item) => {
    const isActive = activeFeature === item.id;
    
    return (
      <div
        key={item.id}
        onClick={() => item.available && onFeatureChange?.(item.id)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: collapsed ? '0' : SPACING.sm,
          justifyContent: collapsed ? 'center' : 'flex-start',
          padding: collapsed ? SPACING.sm : `${SPACING.sm} ${SPACING.md}`,
          marginBottom: SPACING.xs,
          background: isActive ? COLORS.bg.darkest : 'transparent',
          color: isActive ? COLORS.accent.info : COLORS.text.secondary,
          borderRadius: BORDER_RADIUS.sm,
          cursor: item.available ? 'pointer' : 'not-allowed',
          opacity: item.available ? 1 : 0.5,
          transition: 'all 0.2s',
          position: 'relative',
          border: `1px solid ${isActive ? COLORS.border.default : 'transparent'}`
        }}
        onMouseEnter={(e) => {
          if (item.available && !isActive) {
            e.currentTarget.style.background = COLORS.bg.darkest;
            e.currentTarget.style.color = COLORS.text.primary;
          }
        }}
        onMouseLeave={(e) => {
          if (!isActive) {
            e.currentTarget.style.background = 'transparent';
            e.currentTarget.style.color = COLORS.text.secondary;
          }
        }}
        title={collapsed ? item.label : ''}
      >
        {item.icon}
        {!collapsed && (
          <>
            <span style={{ 
              fontSize: FONT_SIZES.sm,
              fontWeight: isActive ? '600' : '400',
              flex: 1
            }}>
              {item.label}
            </span>
            {item.comingSoon && (
              <span style={{
                fontSize: FONT_SIZES.xs,
                color: COLORS.accent.warning,
                background: 'rgba(241, 196, 15, 0.1)',
                padding: '2px 6px',
                borderRadius: '3px',
                fontWeight: '600'
              }}>
                Soon
              </span>
            )}
          </>
        )}
      </div>
    );
  };

  return (
    <div style={{
      width: collapsed ? '60px' : '240px',
      height: '100vh',
      background: COLORS.bg.darker,
      borderRight: `1px solid ${COLORS.border.default}`,
      display: 'flex',
      flexDirection: 'column',
      transition: 'width 0.3s ease',
      position: 'sticky',
      top: 0,
      left: 0
    }}>
      {/* Sidebar Header */}
      <div style={{
        padding: SPACING.md,
        borderBottom: `1px solid ${COLORS.border.default}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: collapsed ? 'center' : 'space-between'
      }}>
        {!collapsed && (
          <h2 style={{
            margin: 0,
            fontSize: FONT_SIZES.md,
            fontWeight: 'bold',
            color: COLORS.text.primary
          }}>
            Dashboard
          </h2>
        )}
        <button
          onClick={onToggleCollapse}
          style={{
            background: 'transparent',
            border: 'none',
            color: COLORS.text.secondary,
            cursor: 'pointer',
            padding: SPACING.xs,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: BORDER_RADIUS.sm,
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = COLORS.bg.darkest;
            e.currentTarget.style.color = COLORS.text.primary;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent';
            e.currentTarget.style.color = COLORS.text.secondary;
          }}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? (
            <ChevronRight size={18} strokeWidth={2} />
          ) : (
            <ChevronLeft size={18} strokeWidth={2} />
          )}
        </button>
      </div>

      {/* Navigation Menu */}
      <div style={{
        flex: 1,
        padding: SPACING.md,
        overflowY: 'auto'
      }}>
        {/* Games Section */}
        {!collapsed && (
          <div style={{
            fontSize: FONT_SIZES.xs,
            color: COLORS.text.tertiary,
            marginBottom: SPACING.xs,
            fontWeight: '600',
            textTransform: 'uppercase',
            letterSpacing: '0.5px'
          }}>
            Games
          </div>
        )}
        <div style={{ marginBottom: SPACING.md }}>
          {games.map(renderGameItem)}
        </div>

        {/* Features Section */}
        {!collapsed && (
          <div style={{
            fontSize: FONT_SIZES.xs,
            color: COLORS.text.tertiary,
            marginBottom: SPACING.xs,
            fontWeight: '600',
            textTransform: 'uppercase',
            letterSpacing: '0.5px'
          }}>
            Features
          </div>
        )}
        <div>
          {features.map(renderFeatureItem)}
        </div>
      </div>

      {/* Footer Info */}
      {!collapsed && (
        <div style={{
          padding: SPACING.md,
          borderTop: `1px solid ${COLORS.border.default}`,
          fontSize: FONT_SIZES.xs,
          color: COLORS.text.tertiary,
          textAlign: 'center'
        }}>
          Stake Tools v1.0
        </div>
      )}
    </div>
  );
}
