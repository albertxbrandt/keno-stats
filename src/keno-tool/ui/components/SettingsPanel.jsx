// src/ui/components/SettingsPanel.jsx
import { h } from 'preact';
import { useState, useEffect } from 'preact/hooks';
import { state } from '@/keno-tool/core/state.js';
import { ToggleSwitch } from './shared/ToggleSwitch.jsx';
import { COLORS } from '@/shared/constants/colors.js';
import { SPACING, BORDER_RADIUS } from '@/shared/constants/styles.js';
import { stateEvents, EVENTS } from '@/keno-tool/core/stateEvents.js';
import { savePanelVisibility, savePanelOrder } from '@/keno-tool/core/storage.js';

export function SettingsPanel() {
  const [panelVisibility, setPanelVisibility] = useState({ ...state.panelVisibility });
  const [panelOrder, setPanelOrder] = useState({
    left: [],
    right: []
  });

  // Track dragging state: { column: 'left'|'right', index: number }
  const [draggedItem, setDraggedItem] = useState(null);

  const defaultOrder = {
    left: ['heatmap', 'numberGenerator', 'hitsMiss', 'autoplay'],
    right: ['profitLoss', 'patternAnalysis', 'recentPlays', 'history']
  };

  // Map section IDs to display data
  const sectionData = {
    heatmap: { label: 'Heatmap', icon: '🗺️' },
    numberGenerator: { label: 'Number Generator', icon: '🎲' },
    hitsMiss: { label: 'Hits / Miss Display', icon: '✅' },
    autoplay: { label: 'Auto-Play', icon: '▶️' },
    profitLoss: { label: 'Profit/Loss', icon: '💰' },
    patternAnalysis: { label: 'Pattern Analysis', icon: '🔍' },
    recentPlays: { label: 'Recent Plays', icon: '🎯' },
    history: { label: 'History', icon: '📋' }
  };

  // Sync with global state on mount
  useEffect(() => {
    let currentOrder = state.panelOrder;

    // Ensure we have the new object structure
    if (!currentOrder || Array.isArray(currentOrder)) {
      currentOrder = defaultOrder;
    }

    // Validate keys exist
    if (!currentOrder.left) currentOrder.left = [];
    if (!currentOrder.right) currentOrder.right = [];

    setPanelOrder({
      left: [...currentOrder.left],
      right: [...currentOrder.right]
    });
  }, []);

  const handleToggle = (section) => (e) => {
    const isChecked = e.target.checked;

    const newVisibility = { ...panelVisibility, [section]: isChecked };
    setPanelVisibility(newVisibility);

    state.panelVisibility = newVisibility;
    stateEvents.emit(EVENTS.SETTINGS_CHANGED, newVisibility);
    savePanelVisibility();
  };

  // Drag and Drop Handlers
  const handleDragStart = (e, column, index) => {
    setDraggedItem({ column, index });
    e.dataTransfer.effectAllowed = 'move';
    // Transparent drag image
    // e.dataTransfer.setDragImage(e.target, 0, 0); // Optional: customize drag image
  };

  const handleDragOver = (e, targetColumn, targetIndex) => {
    e.preventDefault();

    if (!draggedItem) return;

    // Check if moving to a different position
    if (draggedItem.column === targetColumn && draggedItem.index === targetIndex) {
      return;
    }

    const newOrder = {
      left: [...panelOrder.left],
      right: [...panelOrder.right]
    };

    // Remove from old position
    const item = newOrder[draggedItem.column][draggedItem.index];
    newOrder[draggedItem.column].splice(draggedItem.index, 1);

    // Insert at new position
    // If dragging to empty list or end of list, push
    if (targetIndex >= newOrder[targetColumn].length) {
      newOrder[targetColumn].push(item);
    } else {
      newOrder[targetColumn].splice(targetIndex, 0, item);
    }

    setDraggedItem({ column: targetColumn, index: targetIndex });
    setPanelOrder(newOrder);
  };

  // Handle dropping into an empty column
  const handleDragOverContainer = (e, targetColumn) => {
    e.preventDefault();
    if (!draggedItem) return;

    // Only relevant if column is empty, otherwise row handlers take over
    if (panelOrder[targetColumn].length === 0) {
      const newOrder = {
        left: [...panelOrder.left],
        right: [...panelOrder.right]
      };

      const item = newOrder[draggedItem.column][draggedItem.index];
      newOrder[draggedItem.column].splice(draggedItem.index, 1);
      newOrder[targetColumn].push(item);

      setDraggedItem({ column: targetColumn, index: 0 });
      setPanelOrder(newOrder);
    }
  };

  const handleDragEnd = () => {
    setDraggedItem(null);

    // Save new order to state and storage
    state.panelOrder = panelOrder;
    savePanelOrder();

    // Emit event to notify Overlay
    stateEvents.emit('order:changed', panelOrder);
  };

  const renderColumn = (columnId, items) => (
    <div
      style={{ flex: 1, minWidth: 0 }}
      onDragOver={(e) => handleDragOverContainer(e, columnId)}
    >
      <div style={{
        color: COLORS.text.secondary,
        fontSize: '10px',
        marginBottom: SPACING.sm,
        textTransform: 'uppercase',
        fontWeight: 'bold',
        textAlign: 'center'
      }}>
        {columnId === 'left' ? 'Left Column' : 'Right Column'}
      </div>

      <div style={{
        background: COLORS.bg.darker,
        borderRadius: BORDER_RADIUS.md,
        padding: SPACING.xs,
        minHeight: '100px'
      }}>
        {items.map((sectionId, index) => {
          const section = sectionData[sectionId];
          if (!section) return null;

          const isDragging = draggedItem && draggedItem.column === columnId && draggedItem.index === index;

          return (
            <div
              key={sectionId}
              class="settings-row"
              draggable
              onDragStart={(e) => handleDragStart(e, columnId, index)}
              onDragOver={(e) => handleDragOver(e, columnId, index)}
              onDragEnd={handleDragEnd}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '8px',
                marginBottom: '4px',
                background: isDragging ? COLORS.bg.darkest : COLORS.bg.dark,
                borderRadius: BORDER_RADIUS.sm,
                border: `1px solid ${COLORS.border.default}`,
                cursor: 'move',
                opacity: isDragging ? 0.5 : 1,
                transition: 'transform 0.2s ease',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ color: COLORS.text.tertiary, fontSize: '12px', cursor: 'grab' }}>
                  ☰
                </span>
                <span style={{ fontSize: '14px' }}>{section.icon}</span>
                <span style={{ color: '#fff', fontSize: '11px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {section.label}
                </span>
              </div>
              <ToggleSwitch
                checked={panelVisibility[sectionId] !== false}
                onChange={handleToggle(sectionId)}
              />
            </div>
          );
        })}
        {items.length === 0 && (
          <div style={{ padding: '20px', textAlign: 'center', color: COLORS.text.tertiary, fontSize: '10px' }}>
            Drop here
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div style={{
      background: COLORS.bg.dark,
      padding: SPACING.md,
      borderRadius: BORDER_RADIUS.lg
    }}>
      <div style={{ color: COLORS.text.secondary, fontSize: '12px', marginBottom: SPACING.md }}>
        Drag to Reorder & Move Between Columns
      </div>

      <div style={{ display: 'flex', gap: SPACING.md }}>
        {renderColumn('left', panelOrder.left)}
        {renderColumn('right', panelOrder.right)}
      </div>
    </div>
  );
}
