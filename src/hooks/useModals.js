import { h, createContext } from 'preact';
import { useState, useContext, useEffect } from 'preact/hooks';

const ModalsContext = createContext(null);

/**
 * Provider for modal management
 */
export function ModalsProvider({ children }) {
  const [activeModals, setActiveModals] = useState({
    savedNumbers: { open: false, data: null },
    combinationHits: { open: false, data: null },
    patternAnalysis: { open: false, data: null },
    patternLoading: { open: false },
    comparison: { open: false }
  });

  const openModal = (modalName, data = null) => {
    setActiveModals((prev) => ({
      ...prev,
      [modalName]: { open: true, data }
    }));
  };

  const closeModal = (modalName) => {
    setActiveModals((prev) => ({
      ...prev,
      [modalName]: { open: false, data: null }
    }));
  };

  const closeAll = () => {
    setActiveModals({
      savedNumbers: { open: false, data: null },
      combinationHits: { open: false, data: null },
      patternAnalysis: { open: false, data: null },
      patternLoading: { open: false },
      comparison: { open: false }
    });
  };

  const value = {
    activeModals,
    openModal,
    closeModal,
    closeAll,
    // Convenience methods
    showSavedNumbers: () => openModal('savedNumbers'),
    showCombinationHits: (numbers, name) =>
      openModal('combinationHits', { numbers, name }),
    showPatternAnalysis: (patternSize, sortBy, sampleSize) =>
      openModal('patternAnalysis', { patternSize, sortBy, sampleSize }),
    showPatternLoading: () => openModal('patternLoading'),
    hidePatternLoading: () => closeModal('patternLoading'),
    showComparison: () => openModal('comparison'),
    toggleComparison: (show) => {
      if (show) openModal('comparison');
      else closeModal('comparison');
    }
  };

  // Expose API globally for bridge files
  useEffect(() => {
    window.__keno_modalsApi = value;
  }, [value]);

  return h(ModalsContext.Provider, { value }, children);
}

/**
 * Hook to access modal management functions
 */
export function useModals() {
  const context = useContext(ModalsContext);
  if (!context) {
    throw new Error('useModals must be used within ModalsProvider');
  }
  return context;
}
