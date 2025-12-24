import { h } from 'preact';
import { useState, useEffect } from 'preact/hooks';
import { Modal } from '../shared/Modal.jsx';

/**
 * Saved combination card component
 */
function SavedComboCard({ combo, onSelect, onDelete, onInfo }) {
  const date = new Date(combo.createdAt).toLocaleDateString();

  return (
    <div
      style={{
        background: '#0f212e',
        padding: '12px',
        borderRadius: '6px',
        borderLeft: '3px solid #00b894'
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
              color: '#fff',
              fontSize: '14px',
              fontWeight: 'bold',
              marginBottom: '4px'
            }}
          >
            {combo.numbers.join(', ')}
          </div>
          <div style={{ color: '#888', fontSize: '11px' }}>{combo.name}</div>
        </div>
        <div style={{ display: 'flex', gap: '6px' }}>
          <button
            onClick={() => onInfo(combo.numbers, combo.name)}
            style={{
              padding: '6px 10px',
              background: '#2a3b4a',
              color: '#74b9ff',
              border: 'none',
              borderRadius: '4px',
              fontSize: '11px',
              cursor: 'pointer'
            }}
          >
            ℹ️ Info
          </button>
          <button
            onClick={() => onDelete(combo.id)}
            style={{
              padding: '6px 10px',
              background: '#ff7675',
              color: '#fff',
              border: 'none',
              borderRadius: '4px',
              fontSize: '11px',
              cursor: 'pointer'
            }}
          >
            Delete
          </button>
        </div>
      </div>
      <div style={{ color: '#666', fontSize: '10px' }}>Saved: {date}</div>
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
      icon="💾"
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
