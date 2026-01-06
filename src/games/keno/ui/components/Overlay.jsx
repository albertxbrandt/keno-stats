// src/ui/components/Overlay.jsx
// Main overlay container component
// Root of the Preact component tree for the Keno Stats Tracker UI

import { render } from 'preact';
import { useState, useEffect } from 'preact/hooks';
import { state } from '@/games/keno/core/state.js';
import { stateEvents, EVENTS } from '@/games/keno/core/stateEvents.js';
import { HitsMissSection } from './sections/HitsMissSection.tsx';
import { GeneratorSection } from './sections/GeneratorSection.jsx';
import { HeatmapSection } from './sections/HeatmapSection.jsx';
import { ProfitLossSection } from './sections/ProfitLossSection.jsx';
import { PatternAnalysisSection } from './sections/PatternAnalysisSection.jsx';
import { RecentPlaysSection } from './sections/RecentPlaysSection.jsx';
import { HistorySection } from './sections/HistorySection.jsx';
import { DraggableOverlay } from '@/shared/components/DraggableOverlay.jsx';
import { SettingsPanel } from './SettingsPanel.jsx';
import { COLORS } from '@/shared/constants/colors.js';
import { SPACING, BORDER_RADIUS } from '@/shared/constants/styles.js';

// Component mapping for sections
const SECTION_COMPONENTS = {
  heatmap: HeatmapSection,
  numberGenerator: GeneratorSection,
  hitsMiss: HitsMissSection,
  profitLoss: ProfitLossSection,
  patternAnalysis: PatternAnalysisSection,
  recentPlays: RecentPlaysSection,
  history: HistorySection
};

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
  const [panelVisibility, setPanelVisibility] = useState(state.panelVisibility);
  const [panelOrder, setPanelOrder] = useState(state.panelOrder || defaultOrder);

  // Default order fallback
  const defaultOrder = ['heatmap', 'numberGenerator', 'hitsMiss', 'autoplay', 'profitLoss', 'patternAnalysis', 'recentPlays', 'history'];

  // Listen for toggle events from footer button and settings changes
  useEffect(() => {
    const handleToggle = () => {
      setIsVisible(state.isOverlayVisible);
    };
    
    const handleSettingsChange = (newVisibility) => {
      setPanelVisibility({ ...newVisibility });
    };

    const handleOrderChange = (newOrder) => {
      setPanelOrder([...newOrder]);
    };

    window.addEventListener('keno-overlay-toggle', handleToggle);
    const unsubscribeSettings = stateEvents.on(EVENTS.PANEL_VISIBILITY_CHANGED, handleSettingsChange);
    const unsubscribeOrder = stateEvents.on('order:changed', handleOrderChange);
    
    return () => {
      window.removeEventListener('keno-overlay-toggle', handleToggle);
      unsubscribeSettings();
      unsubscribeOrder();
    };
  }, []);

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
    <DraggableOverlay
      title="Keno Stats Tracker"
      onClose={handleClose}
      onSettingsClick={() => setCurrentView(currentView === 'tracker' ? 'settings' : 'tracker')}
      isActive={true}
      defaultPosition={{ x: window.innerWidth - 320, y: 80 }}
      width="280px"
    >
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
        {/* Render sections dynamically based on order and visibility */}
        {panelOrder.map(sectionId => {
          const Component = SECTION_COMPONENTS[sectionId];
          return panelVisibility[sectionId] && Component ? <Component key={sectionId} /> : null;
        })}
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
    </DraggableOverlay>
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
