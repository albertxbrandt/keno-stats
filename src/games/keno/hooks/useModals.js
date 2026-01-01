import { h, createContext } from 'preact';
import { useState, useContext, useEffect } from 'preact/hooks';

const ModalsContext = createContext(null);

/**
 * Provider for modal management
 */
export function ModalsProvider({ children }) {
  const [activeModals, setActiveModals] = useState({
    savedNumbers: { open: false, data: null },
    patternAnalysis: { open: false, data: null },
    patternLoading: { open: false },
    livePatternAnalysis: { open: false },
    comparison: { open: false }
  });

  // Stats modals can have multiple instances
  const [statsModals, setStatsModals] = useState([]);

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
      patternAnalysis: { open: false, data: null },
      patternLoading: { open: false },
      livePatternAnalysis: { open: false },
      comparison: { open: false }
    });
    setStatsModals([]);
  };

  // Stats modal management
  const openStatsModal = (numbers, name, trackLive = false) => {
    const id = `stats-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    setStatsModals((prev) => [...prev, { id, numbers, name, trackLive }]);
    return id;
  };

  const closeStatsModal = (id) => {
    setStatsModals((prev) => prev.filter((modal) => modal.id !== id));
  };

  const value = {
    activeModals,
    statsModals,
    openModal,
    closeModal,
    closeAll,
    openStatsModal,
    closeStatsModal,
    // Convenience methods
    showSavedNumbers: () => openModal('savedNumbers'),
    showCombinationHits: (numbers, name) => openStatsModal(numbers, name, false),
    showPatternAnalysis: (patternSize, sortBy, sampleSize) =>
      openModal('patternAnalysis', { patternSize, sortBy, sampleSize }),
    showPatternLoading: () => openModal('patternLoading'),
    hidePatternLoading: () => closeModal('patternLoading'),
    showLivePatternAnalysis: () => openModal('livePatternAnalysis'),
    hideLivePatternAnalysis: () => closeModal('livePatternAnalysis'),
    showComparison: () => openModal('comparison'),
    toggleComparison: (show) => {
      if (show) openModal('comparison');
      else closeModal('comparison');
    },
    showLiveStats: () => openStatsModal([], 'Live Selection', true)
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
