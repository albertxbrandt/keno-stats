/**
 * Utilities management hook
 * Provides centralized state management for stake-wide utilities
 * Similar to keno's useModals pattern but for utilities
 */

import { h, createContext } from 'preact';
import { useState, useContext, useEffect } from 'preact/hooks';

const UtilitiesContext = createContext(null);

/**
 * Provider for utilities management
 */
export function UtilitiesProvider({ children }) {
  const [activeUtilities, setActiveUtilities] = useState({
    coinFlipper: false,
    randomGen: false,
    magic8Ball: false,
    winLinks: false,
  });

  const openUtility = (utilityName) => {
    setActiveUtilities((prev) => ({
      ...prev,
      [utilityName]: true,
    }));
  };

  const closeUtility = (utilityName) => {
    setActiveUtilities((prev) => ({
      ...prev,
      [utilityName]: false,
    }));
  };

  const toggleUtility = (utilityName) => {
    setActiveUtilities((prev) => ({
      ...prev,
      [utilityName]: !prev[utilityName],
    }));
  };

  const closeAll = () => {
    setActiveUtilities({
      coinFlipper: false,
      randomGen: false,
      magic8Ball: false,
      winLinks: false,
    });
  };

  const value = {
    activeUtilities,
    openUtility,
    closeUtility,
    toggleUtility,
    closeAll,
    // Convenience methods
    openCoinFlipper: () => openUtility('coinFlipper'),
    closeCoinFlipper: () => closeUtility('coinFlipper'),
    openRandomGen: () => openUtility('randomGen'),
    closeRandomGen: () => closeUtility('randomGen'),
    openMagic8Ball: () => openUtility('magic8Ball'),
    closeMagic8Ball: () => closeUtility('magic8Ball'),
    openWinLinks: () => openUtility('winLinks'),
    closeWinLinks: () => closeUtility('winLinks'),
  };

  // Expose API globally for potential hotkeys/external triggers
  useEffect(() => {
    window.__stake_utilitiesApi = value;
  }, [value]);

  return h(UtilitiesContext.Provider, { value }, children);
}

/**
 * Hook to access utilities management functions
 */
export function useUtilities() {
  const context = useContext(UtilitiesContext);
  if (!context) {
    throw new Error('useUtilities must be used within UtilitiesProvider');
  }
  return context;
}
