// src/ui/components/Overlay.jsx
// Main overlay container component
// Root of the Preact component tree for the Keno Stats Tracker UI

import { render } from 'preact';
import { useState, useEffect, useRef } from 'preact/hooks';
import { state } from '@/keno-tool/core/state.js';
import { HitsMissSection } from './sections/HitsMissSection.jsx';
import { GeneratorSection } from './sections/GeneratorSection.jsx';
import { HeatmapSection } from './sections/HeatmapSection.jsx';
import { ProfitLossSection } from './sections/ProfitLossSection.jsx';
import { PatternAnalysisSection } from './sections/PatternAnalysisSection.jsx';
import { RecentPlaysSection } from './sections/RecentPlaysSection.jsx';
import { HistorySection } from './sections/HistorySection.jsx';
import { DragHandle } from './shared/DragHandle.jsx';
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
 * - Tracker Tab: Main view with all stats sections
 *   - HeatmapSection
 *   - GeneratorSection (largest, needs sub-components)
 *   - HitsMissSection
 *   - ProfitLossSection
 *   - PatternAnalysisSection
 *   - RecentPlaysSection
 *   - HistorySection
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

  // Dragging state
  const [position, setPosition] = useState({ top: 80, left: null, right: 20 });
  const dragStartRef = useRef({ top: 0, left: 0 });

  // Listen for toggle events from footer button
  useEffect(() => {
    const handleToggle = () => {
      setIsVisible(state.isOverlayVisible);
    };
    
    window.addEventListener('keno-overlay-toggle', handleToggle);
    
    return () => {
      window.removeEventListener('keno-overlay-toggle', handleToggle);
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

  if (!isVisible) {
    return null;
  }

  return (
    <div 
      id="keno-tracker-overlay"
      style={{
        position: 'fixed',
        ...(position.left !== null ? { left: `${position.left}px` } : { right: `${position.right}px` }),
        top: `${position.top}px`,
        width: '240px',
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
          display: currentView === 'tracker' ? 'block' : 'none'
        }}
      >
        {/* Migrated: HeatmapSection */}
        <HeatmapSection />
        
        {/* Migrated: GeneratorSection */}
        <GeneratorSection />
        
        {/* Migrated: HitsMissSection */}
        <HitsMissSection />
        
        {/* Migrated: ProfitLossSection */}
        <ProfitLossSection />
        
        {/* Migrated: PatternAnalysisSection */}
        <PatternAnalysisSection />
        
        {/* Migrated: RecentPlaysSection */}
        <RecentPlaysSection />
        
        {/* Migrated: HistorySection */}
        <HistorySection />
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
        <div style={{
          background: COLORS.bg.dark,
          padding: SPACING.md,
          borderRadius: BORDER_RADIUS.lg
        }}>
          <div style={{ color: COLORS.text.secondary, fontSize: '12px', marginBottom: SPACING.md }}>
            Panel Settings
          </div>
          
          <div style={{ color: COLORS.text.tertiary, fontSize: '11px', lineHeight: '1.6' }}>
            <p style={{ margin: '0 0 10px 0' }}>
              All panels are currently visible and cannot be reordered in this version.
            </p>
            <p style={{ margin: '0 0 10px 0' }}>
              Future features:
            </p>
            <ul style={{ margin: 0, paddingLeft: '20px' }}>
              <li>Show/hide individual panels</li>
              <li>Drag to reorder panels</li>
              <li>Save panel preferences</li>
            </ul>
          </div>
        </div>
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
