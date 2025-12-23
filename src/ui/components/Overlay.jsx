// src/ui/components/Overlay.jsx
// Main overlay container component
// Root of the Preact component tree for the Keno Stats Tracker UI

import { render } from 'preact';
import { useState, useEffect } from 'preact/hooks';
import { state } from '../../core/state.js';
// eslint-disable-next-line no-unused-vars
import { HitsMissSection } from './sections/HitsMissSection.jsx';
// eslint-disable-next-line no-unused-vars
import { GeneratorSection } from './sections/GeneratorSection.jsx';

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
 * Currently migrated:
 * - HitsMissSection ✅
 * - GeneratorSection ✅
 * 
 * TODO:
 * - DragHandle component
 * - HeatmapSection
 * - ProfitLossSection
 * - PatternAnalysisSection
 * - RecentPlaysSection
 * - HistorySection
 * - Settings tab
 */
export function Overlay() {
  const [isVisible, setIsVisible] = useState(true);
  // eslint-disable-next-line no-unused-vars
  const [currentView, setCurrentView] = useState('tracker'); // 'tracker' or 'settings' - TODO: Wire up settings tab

  // Dragging state - TODO: Implement drag functionality
  // eslint-disable-next-line no-unused-vars
  const [isDragging, setIsDragging] = useState(false);
  // eslint-disable-next-line no-unused-vars
  const [position, setPosition] = useState({ top: 80, right: 20 });

  // Sync with global state
  useEffect(() => {
    setIsVisible(state.isOverlayVisible);
  }, [state.isOverlayVisible]);

  const handleClose = () => {
    setIsVisible(false);
    state.isOverlayVisible = false;
  };

  if (!isVisible) {
    return null;
  }

  return (
    <div 
      id="keno-tracker-overlay"
      style={{
        position: 'fixed',
        top: `${position.top}px`,
        right: `${position.right}px`,
        width: '240px',
        backgroundColor: 'transparent',
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
      {/* Drag Handle (TODO: Extract to component) */}
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
            style={{ cursor: 'pointer', fontSize: '16px', color: '#fff' }}
            title="Settings"
          >
            ⚙️
          </span>
          <span 
            id="tracker-status"
            style={{ color: '#f55', fontSize: '16px', pointerEvents: 'none' }}
          >
            ●
          </span>
          <span 
            onClick={handleClose}
            style={{ cursor: 'pointer', fontWeight: 'bold', color: '#fff', fontSize: '14px' }}
          >
            ✕
          </span>
        </div>
      </div>

      {/* Tracker Tab Content */}
      <div 
        id="keno-overlay-content"
        class="tab-content"
        style={{
          padding: '15px',
          background: '#213743',
          borderBottomLeftRadius: '8px',
          borderBottomRightRadius: '8px',
          display: currentView === 'tracker' ? 'block' : 'none'
        }}
      >
        {/* TODO: HeatmapSection */}
        
        {/* Migrated: GeneratorSection */}
        <GeneratorSection />
        
        {/* Migrated: HitsMissSection */}
        <HitsMissSection />
        
        {/* TODO: ProfitLossSection */}
        {/* TODO: PatternAnalysisSection */}
        {/* TODO: RecentPlaysSection */}
        {/* TODO: HistorySection */}
      </div>

      {/* Settings Tab Content (TODO) */}
      <div 
        id="keno-settings-content"
        class="tab-content"
        style={{
          padding: '15px',
          background: '#213743',
          borderBottomLeftRadius: '8px',
          borderBottomRightRadius: '8px',
          display: currentView === 'settings' ? 'block' : 'none'
        }}
      >
        <div>Settings content (TODO)</div>
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
