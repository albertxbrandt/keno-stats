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
// eslint-disable-next-line no-unused-vars
import { HeatmapSection } from './sections/HeatmapSection.jsx';
// eslint-disable-next-line no-unused-vars
import { ProfitLossSection } from './sections/ProfitLossSection.jsx';
// eslint-disable-next-line no-unused-vars
import { PatternAnalysisSection } from './sections/PatternAnalysisSection.jsx';
// eslint-disable-next-line no-unused-vars
import { RecentPlaysSection } from './sections/RecentPlaysSection.jsx';
// eslint-disable-next-line no-unused-vars
import { HistorySection } from './sections/HistorySection.jsx';
// eslint-disable-next-line no-unused-vars
import { DragHandle } from './shared/DragHandle.jsx';

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
  // eslint-disable-next-line no-unused-vars
  const [currentView, setCurrentView] = useState('tracker'); // 'tracker' or 'settings'

  // Dragging state - TODO: Implement drag functionality
  // eslint-disable-next-line no-unused-vars
  const [isDragging, setIsDragging] = useState(false);
  // eslint-disable-next-line no-unused-vars
  const [position, setPosition] = useState({ top: 80, right: 20 });

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

  const handleClose = () => {
    setIsVisible(false);
    state.isOverlayVisible = false;
    
    // Update footer button text
    const btn = document.getElementById('keno-tracker-toggle-btn');
    if (btn) {
      btn.textContent = '📊 Open Stats';
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
      {/* Drag Handle */}
      <DragHandle 
        onClose={handleClose}
        onSettingsClick={() => setCurrentView(currentView === 'tracker' ? 'settings' : 'tracker')}
        isActive={true}
      />

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
          padding: '15px',
          background: '#213743',
          borderBottomLeftRadius: '8px',
          borderBottomRightRadius: '8px',
          display: currentView === 'settings' ? 'block' : 'none'
        }}
      >
        <div style={{
          background: '#0f212e',
          padding: '15px',
          borderRadius: '8px'
        }}>
          <div style={{ color: '#aaa', fontSize: '12px', marginBottom: '15px' }}>
            Panel Settings
          </div>
          
          <div style={{ color: '#666', fontSize: '11px', lineHeight: '1.6' }}>
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
