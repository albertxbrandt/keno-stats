import { h } from 'preact';
import { useState, useEffect } from 'preact/hooks';
import { Modal } from '@/shared/components/Modal';
import { Button } from '@/shared/components/Button';
import { Save, Info, Trash2 } from 'lucide-preact';
import { COLORS } from '@/shared/constants/colors.js';
import { BORDER_RADIUS, SPACING } from '@/shared/constants/styles.js';

/**
 * Saved combination card component
 */
function SavedComboCard({ combo, onSelect, onDelete, onInfo }) {
  const date = new Date(combo.createdAt).toLocaleDateString();

  return (
    <div
      style={{
        background: COLORS.bg.dark,
        padding: SPACING.md,
        borderRadius: BORDER_RADIUS.md,
        borderLeft: `3px solid ${COLORS.accent.success}`
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '6px'
        }}
      >
        <div
          onClick={() => onSelect(combo.numbers)}
          style={{ flex: 1, cursor: 'pointer' }}
          title="Click to select these numbers"
        >
          <div
            style={{
              color: COLORS.text.primary,
              fontSize: '14px',
              fontWeight: 'bold',
              marginBottom: '4px'
            }}
          >
            {combo.numbers.join(', ')}
          </div>
          <div style={{ color: COLORS.text.secondary, fontSize: '11px' }}>{combo.name}</div>
        </div>
        <div style={{ display: 'flex', gap: '6px' }}>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onInfo(combo.numbers, combo.name)}
            icon={<Info size={12} strokeWidth={2} />}
            iconPosition="left"
          >
            Info
          </Button>
          <Button
            variant="danger"
            size="sm"
            onClick={() => onDelete(combo.id)}
            icon={<Trash2 size={12} strokeWidth={2} />}
          />
        </div>
      </div>
      <div style={{ color: COLORS.text.tertiary, fontSize: '10px' }}>Saved: {date}</div>
    </div>
  );
}

/**
 * Saved numbers modal component
 */
export function SavedNumbersModal({ savedNumbers, onClose, onSelect, onDelete, onInfo }) {
  const [combos, setCombos] = useState(savedNumbers);

  useEffect(() => {
    setCombos(savedNumbers);
  }, [savedNumbers]);

  const handleDelete = (id) => {
    if (confirm('Delete this saved combination?')) {
      onDelete(id).then(() => {
        // Remove from local state
        setCombos(combos.filter((c) => c.id !== id));
      });
    }
  };

  return (
    <Modal
      title="Saved Number Combinations"
      icon={<Save size={16} strokeWidth={2} />}
      onClose={onClose}
      defaultPosition={{ x: window.innerWidth / 2 - 250, y: 100 }}
      defaultSize={{ width: 500, height: 'auto' }}
      zIndex={1000000}
    >
      {combos.length === 0 ? (
        <div
          style={{
            color: '#666',
            textAlign: 'center',
            padding: '40px 20px',
            lineHeight: '1.6'
          }}
        >
          No saved combinations yet.
          <br />
          <br />
          Play some rounds and save your favorite number combinations!
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {combos.map((combo) => (
            <SavedComboCard
              key={combo.id}
              combo={combo}
              onSelect={(numbers) => {
                onSelect(numbers);
                onClose();
              }}
              onDelete={handleDelete}
              onInfo={onInfo}
            />
          ))}
        </div>
      )}
    </Modal>
  );
}
