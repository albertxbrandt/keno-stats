// src/ui/components/Overlay.jsx
// Main overlay container component
// Root of the Preact component tree for the Keno Stats Tracker UI

import { render } from 'preact';
import { useState, useEffect, useRef } from 'preact/hooks';
import { state } from '@/keno-tool/core/state.js';
import { stateEvents, EVENTS } from '@/keno-tool/core/stateEvents.js';
import { HitsMissSection } from './sections/HitsMissSection.jsx';
import { GeneratorSection } from './sections/GeneratorSection.jsx';
import { HeatmapSection } from './sections/HeatmapSection.jsx';
import { ProfitLossSection } from './sections/ProfitLossSection.jsx';
import { PatternAnalysisSection } from './sections/PatternAnalysisSection.jsx';
import { RecentPlaysSection } from './sections/RecentPlaysSection.jsx';
import { HistorySection } from './sections/HistorySection.jsx';
import { DragHandle } from './shared/DragHandle.jsx';
import { SettingsPanel } from './SettingsPanel.jsx';
import { COLORS } from '@/shared/constants/colors.js';
import { SPACING, BORDER_RADIUS } from '@/shared/constants/styles.js';

/**
 * Overlay Component
 * 
 * Main container for the Keno Stats Tracker extension overlay.
 * Handles:
 * - Draggable positioning
 * - Show/hide state
 * - Tab switching (Tracker vs Settings)
 * - Component composition
 * 
 * @component
 * @returns {preact.VNode} The rendered overlay
 * 
 * @architecture
 * The overlay is composed of several major sections:
 * - DragHandle: Top bar with title, status indicator, settings icon, close button
 * - Tracker Tab: Main view with all stats sections, split into TWO COLUMNS
 *   - Left Column: Heatmap, Generator, etc.
 *   - Right Column: History, Recent Plays, etc.
 * - Settings Tab: Panel visibility and ordering
 * 
 * @migration-status
 * ✅ REFACTOR COMPLETE - All components migrated to Preact!
 * 
 * Sections:
 * - HeatmapSection ✅
 * - GeneratorSection ✅ (6 sub-components)
 * - HitsMissSection ✅
 * - ProfitLossSection ✅
 * - PatternAnalysisSection ✅
 * - RecentPlaysSection ✅
 * - HistorySection ✅
 * - DragHandle ✅
 * - Settings tab ✅ (basic implementation)
 */
export function Overlay() {
  const [isVisible, setIsVisible] = useState(state.isOverlayVisible);
  const [currentView, setCurrentView] = useState('tracker'); // 'tracker' or 'settings'
  const [panelVisibility, setPanelVisibility] = useState(state.panelVisibility);
  const [panelOrder, setPanelOrder] = useState(state.panelOrder || defaultOrder);

  // Default order fallback (2-column layout)
  const defaultOrder = {
    left: ['heatmap', 'numberGenerator', 'hitsMiss'],
    right: ['profitLoss', 'patternAnalysis', 'recentPlays', 'history']
  };

  // Dragging state
  const [position, setPosition] = useState({ top: 80, left: null, right: 20 });
  const dragStartRef = useRef({ top: 0, left: 0 });

  // Listen for toggle events from footer button and settings changes
  useEffect(() => {
    const handleToggle = () => {
      setIsVisible(state.isOverlayVisible);
    };
    
    const handleSettingsChange = (newVisibility) => {
      setPanelVisibility({ ...newVisibility });
    };

    const handleOrderChange = (newOrder) => {
      // Ensure we have a valid object structure
      if (Array.isArray(newOrder)) {
        // Fallback migration if event sends array (shouldn't happen with updated SettingsPanel)
        const mid = Math.ceil(newOrder.length / 2);
        setPanelOrder({
          left: newOrder.slice(0, mid),
          right: newOrder.slice(mid)
        });
      } else {
        setPanelOrder({ ...newOrder });
      }
    };

    window.addEventListener('keno-overlay-toggle', handleToggle);
    const unsubscribeSettings = stateEvents.on(EVENTS.SETTINGS_CHANGED, handleSettingsChange);
    const unsubscribeOrder = stateEvents.on('order:changed', handleOrderChange);
    
    return () => {
      window.removeEventListener('keno-overlay-toggle', handleToggle);
      unsubscribeSettings();
      unsubscribeOrder();
    };
  }, []);

  const handleDragStart = () => {
    // Store the current position when drag starts
    const overlay = document.getElementById('keno-tracker-overlay');
    if (!overlay) return;
    
    const rect = overlay.getBoundingClientRect();
    dragStartRef.current = { top: rect.top, left: rect.left };
    
    // Convert right-based positioning to left-based for dragging
    setPosition({ top: rect.top, left: rect.left, right: null });
  };

  const handleDrag = (dx, dy) => {
    setPosition({
      top: dragStartRef.current.top + dy,
      left: dragStartRef.current.left + dx,
      right: null
    });
  };

  const handleDragEnd = () => {
    // Position is already updated in state, nothing more needed
  };

  const handleClose = () => {
    setIsVisible(false);
    state.isOverlayVisible = false;
    
    // Update footer button text
    const btn = document.getElementById('keno-tracker-toggle-btn');
    if (btn) {
      const span = btn.querySelector('span');
      if (span) {
        span.textContent = 'Open Stats';
      }
    }
  };

  const renderSection = (sectionId) => {
    if (panelVisibility[sectionId] === false) return null;

    switch (sectionId) {
      case 'heatmap': return <HeatmapSection key="heatmap" />;
      case 'numberGenerator': return <GeneratorSection key="generator" />;
      case 'hitsMiss': return <HitsMissSection key="hitsMiss" />;
      case 'profitLoss': return <ProfitLossSection key="profitLoss" />;
      case 'patternAnalysis': return <PatternAnalysisSection key="patternAnalysis" />;
      case 'recentPlays': return <RecentPlaysSection key="recentPlays" />;
      case 'history': return <HistorySection key="history" />;
      default: return null;
    }
  };

  if (!isVisible) {
    return null;
  }

  // Ensure panelOrder has left/right keys (fallback for safety)
  const safeOrder = {
    left: Array.isArray(panelOrder) ? panelOrder : (panelOrder.left || []),
    right: Array.isArray(panelOrder) ? [] : (panelOrder.right || [])
  };

  return (
    <div 
      id="keno-tracker-overlay"
      style={{
        position: 'fixed',
        ...(position.left !== null ? { left: `${position.left}px` } : { right: `${position.right}px` }),
        top: `${position.top}px`,
        // Increased width for 2 columns (240px * 2 + gap)
        width: '500px',
        backgroundColor: COLORS.bg.darker,
        color: '#fff',
        padding: '0',
        borderRadius: '8px',
        zIndex: '999999',
        fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial',
        border: '1px solid #1a2c38',
        boxShadow: '0 4px 10px rgba(0,0,0,0.5)',
        fontSize: '11px',
        display: isVisible ? 'block' : 'none',
        overflow: 'visible'
      }}
    >
      {/* Drag Handle */}
      <DragHandle 
        onClose={handleClose}
        onSettingsClick={() => setCurrentView(currentView === 'tracker' ? 'settings' : 'tracker')}
        onDragStart={handleDragStart}
        onDrag={handleDrag}
        onDragEnd={handleDragEnd}
        isActive={true}
      />

      {/* Tracker Tab Content */}
      <div 
        id="keno-overlay-content"
        class="tab-content"
        style={{
          padding: SPACING.md,
          background: COLORS.bg.lighter,
          borderBottomLeftRadius: BORDER_RADIUS.lg,
          borderBottomRightRadius: BORDER_RADIUS.lg,
          display: currentView === 'tracker' ? 'flex' : 'none',
          gap: SPACING.md,
          alignItems: 'flex-start'
        }}
      >
        {/* Left Column */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: SPACING.lg }}>
          {safeOrder.left.map(renderSection)}
        </div>

        {/* Right Column */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: SPACING.lg }}>
          {safeOrder.right.map(renderSection)}
        </div>
      </div>

      {/* Settings Tab Content */}
      <div 
        id="keno-settings-content"
        class="tab-content"
        style={{
          padding: SPACING.md,
          background: COLORS.bg.lighter,
          borderBottomLeftRadius: BORDER_RADIUS.lg,
          borderBottomRightRadius: BORDER_RADIUS.lg,
          display: currentView === 'settings' ? 'block' : 'none'
        }}
      >
        <SettingsPanel />
      </div>
    </div>
  );
}

/**
 * Initialize and render the Preact overlay
 * Call this function to mount the overlay to the DOM
 * 
 * @param {HTMLElement} [container] - DOM element to render into (creates if not provided)
 * @returns {void}
 * 
 * @example
 * import { initPreactOverlay } from './components/Overlay.jsx';
 * initPreactOverlay();
 */
export function initPreactOverlay(container) {
  // Create container if not provided
  if (!container) {
    container = document.createElement('div');
    container.id = 'keno-tracker-preact-root';
    document.body.appendChild(container);
  }

  // Render the Preact tree
  render(<Overlay />, container);
}
