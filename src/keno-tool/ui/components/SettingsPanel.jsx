// src/ui/components/SettingsPanel.jsx
import { h } from 'preact';
import { useState, useEffect, useRef } from 'preact/hooks';
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

  // Use ref to track order synchronously for drag events
  const panelOrderRef = useRef({ left: [], right: [] });

  // Track dragging state: { column: 'left'|'right', index: number }
  const [draggedItem, setDraggedItem] = useState(null);

  const defaultOrder = {
    left: ['heatmap', 'numberGenerator', 'hitsMiss'],
    right: ['profitLoss', 'patternAnalysis', 'recentPlays', 'history']
  };

  // Map section IDs to display data
  const sectionData = {
    heatmap: { label: 'Heatmap', icon: '🗺️' },
    numberGenerator: { label: 'Number Generator', icon: '🎲' },
    hitsMiss: { label: 'Hits / Miss Display', icon: '✅' },
    profitLoss: { label: 'Profit/Loss', icon: '💰' },
    patternAnalysis: { label: 'Pattern Analysis', icon: '🔍' },
    recentPlays: { label: 'Recent Plays', icon: '🎯' },
    history: { label: 'History', icon: '📋' }
  };

  // Update both state and ref
  const updateOrder = (newOrder) => {
    setPanelOrder(newOrder);
    panelOrderRef.current = newOrder;
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

    updateOrder({
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
    // e.dataTransfer.setDragImage(e.target, 0, 0);
  };

  const handleDragOver = (e, targetColumn, targetIndex) => {
    e.preventDefault();

    if (!draggedItem) return;

    // Check if moving to a different position
    if (draggedItem.column === targetColumn && draggedItem.index === targetIndex) {
      return;
    }

    // Use REF for current state to avoid closure staleness during rapid drags
    const currentRef = panelOrderRef.current;

    const newOrder = {
      left: [...currentRef.left],
      right: [...currentRef.right]
    };

    // Safety check: ensure dragged item exists
    if (!newOrder[draggedItem.column] || !newOrder[draggedItem.column][draggedItem.index]) {
      return;
    }

    // Remove from old position
    const item = newOrder[draggedItem.column][draggedItem.index];
    newOrder[draggedItem.column].splice(draggedItem.index, 1);

    // Insert at new position
    if (targetIndex >= newOrder[targetColumn].length) {
      newOrder[targetColumn].push(item);
    } else {
      newOrder[targetColumn].splice(targetIndex, 0, item);
    }

    setDraggedItem({ column: targetColumn, index: targetIndex });
    updateOrder(newOrder);
  };

  // Handle drop on empty column or container background
  const handleDropContainer = (e, targetColumn) => {
    e.preventDefault();
    e.stopPropagation();

    if (!draggedItem) return;

    const currentRef = panelOrderRef.current;

    // Only if column is empty, logic to append is helpful
    // If not empty, dragOver handles reordering.
    if (currentRef[targetColumn].length === 0) {
        const newOrder = {
            left: [...currentRef.left],
            right: [...currentRef.right]
        };

        // Safety check
        if (!newOrder[draggedItem.column][draggedItem.index]) return;

        const item = newOrder[draggedItem.column][draggedItem.index];
        newOrder[draggedItem.column].splice(draggedItem.index, 1);
        newOrder[targetColumn].push(item);

        setDraggedItem({ column: targetColumn, index: 0 });
        updateOrder(newOrder);
    }
  };

  const handleDragEnd = () => {
    setDraggedItem(null);

    // Use ref to ensure we save the absolute latest state
    // even if state update is pending
    const finalOrder = panelOrderRef.current;

    state.panelOrder = finalOrder;
    savePanelOrder();

    stateEvents.emit('order:changed', finalOrder);
  };

  const renderColumn = (columnId, items) => (
    <div
      style={{ flex: 1, minWidth: 0 }}
      onDragOver={(e) => e.preventDefault()} // Allow dropping
      onDrop={(e) => handleDropContainer(e, columnId)}
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
