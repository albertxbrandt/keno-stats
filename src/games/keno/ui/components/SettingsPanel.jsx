// src/ui/components/SettingsPanel.jsx
import { h } from 'preact';
import { useState, useEffect } from 'preact/hooks';
import { state } from '@/games/keno/core/state.js';
import { ToggleSwitch } from './shared/ToggleSwitch.jsx';
import { COLORS } from '@/shared/constants/colors.js';
import { SPACING, BORDER_RADIUS } from '@/shared/constants/styles.js';
import { stateEvents, EVENTS } from '@/games/keno/core/stateEvents.js';
import { savePanelVisibility, savePanelOrder } from '@/games/keno/core/storage.js';
import { PANEL_SECTIONS } from '@/games/keno/ui/constants/sections.js';

export function SettingsPanel() {
  const [panelVisibility, setPanelVisibility] = useState({ ...state.panelVisibility });
  const [panelOrder, setPanelOrder] = useState([...(state.panelOrder || getDefaultOrder())]);
  const [draggedItem, setDraggedItem] = useState(null);

  // Get default order from PANEL_SECTIONS
  function getDefaultOrder() {
    return PANEL_SECTIONS.map(s => s.id);
  }

  // Create section data map from PANEL_SECTIONS
  const sectionDataMap = PANEL_SECTIONS.reduce((acc, section) => {
    acc[section.id] = section;
    return acc;
  }, {});

  // Sync with global state on mount
  useEffect(() => {
    setPanelOrder([...(state.panelOrder || getDefaultOrder())]);
  }, []);

  const handleToggle = (section) => (e) => {
    const isChecked = e.target.checked;

    const newVisibility = { ...panelVisibility, [section]: isChecked };
    setPanelVisibility(newVisibility);

    state.panelVisibility = newVisibility;
    stateEvents.emit(EVENTS.PANEL_VISIBILITY_CHANGED, newVisibility);
    savePanelVisibility();
  };

  // Drag and Drop Handlers
  const handleDragStart = (e, index) => {
    setDraggedItem(index);
    e.dataTransfer.effectAllowed = 'move';
    // Transparent drag image
    e.dataTransfer.setDragImage(e.target, 0, 0);
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    const draggedOverItem = index;

    // if the item is dragged over itself, ignore
    if (draggedItem === null || draggedItem === draggedOverItem) {
      return;
    }

    // Filter out the item being dragged
    const newOrder = [...panelOrder];
    const draggedSectionId = newOrder[draggedItem];

    // Remove from old position
    newOrder.splice(draggedItem, 1);

    // Insert at new position
    newOrder.splice(draggedOverItem, 0, draggedSectionId);

    setDraggedItem(draggedOverItem);
    setPanelOrder(newOrder);
  };

  const handleDragEnd = () => {
    setDraggedItem(null);

    // Save new order to state and storage
    state.panelOrder = panelOrder;
    savePanelOrder();

    // Emit event to notify Overlay
    stateEvents.emit('order:changed', panelOrder);
  };
  return (
    <div style={{
      background: COLORS.bg.dark,
      padding: SPACING.md,
      borderRadius: BORDER_RADIUS.lg
    }}>
      <div style={{ color: COLORS.text.secondary, fontSize: '12px', marginBottom: SPACING.md }}>
        Show/Hide & Reorder Panels
      </div>

      <div id="settings-list">
        {panelOrder.map((sectionId, index) => {
          const section = sectionDataMap[sectionId];
          if (!section) return null; // Skip unknown sections

          return (
            <div
              key={sectionId}
              class="settings-row"
              draggable
              onDragStart={(e) => handleDragStart(e, index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragEnd={handleDragEnd}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 0',
                borderBottom: `1px solid ${COLORS.border.default}`,
                cursor: 'move',
                opacity: draggedItem === index ? 0.5 : 1,
                transition: 'transform 0.2s ease',
                background: draggedItem === index ? COLORS.bg.darker : 'transparent'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ color: COLORS.text.tertiary, fontSize: '14px', cursor: 'grab' }}>
                  ☰
                </span>
                <span style={{ fontSize: '16px' }}>{section.icon}</span>
                <span style={{ color: '#fff', fontSize: '12px' }}>{section.label}</span>
              </div>
              <ToggleSwitch
                checked={panelVisibility[sectionId] !== false}
                onChange={handleToggle(sectionId)}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
