/**
 * Utilities management hook
 * Provides centralized state management for stake-wide utilities
 * Similar to keno's useModals pattern but for utilities
 */

import { h, createContext, ComponentChildren } from "preact";
import { useState, useContext, useEffect } from "preact/hooks";

interface ActiveUtilities {
  coinFlipper: boolean;
  randomGen: boolean;
  randomGamePicker: boolean;
  magic8Ball: boolean;
  winLinks: boolean;
}

interface UtilitiesContextValue {
  activeUtilities: ActiveUtilities;
  openUtility: (utilityName: keyof ActiveUtilities) => void;
  closeUtility: (utilityName: keyof ActiveUtilities) => void;
  toggleUtility: (utilityName: keyof ActiveUtilities) => void;
  closeAll: () => void;
  openCoinFlipper: () => void;
  closeCoinFlipper: () => void;
  openRandomGen: () => void;
  closeRandomGen: () => void;
  openMagic8Ball: () => void;
  closeMagic8Ball: () => void;
  openWinLinks: () => void;
  closeWinLinks: () => void;
}

const UtilitiesContext = createContext<UtilitiesContextValue | null>(null);

interface UtilitiesProviderProps {
  children: ComponentChildren;
}

/**
 * Provider for utilities management
 */
export function UtilitiesProvider({ children }: UtilitiesProviderProps) {
  const [activeUtilities, setActiveUtilities] = useState<ActiveUtilities>({
    coinFlipper: false,
    randomGen: false,
    randomGamePicker: false,
    magic8Ball: false,
    winLinks: false,
  });

  const openUtility = (utilityName: keyof ActiveUtilities) => {
    setActiveUtilities((prev) => ({
      ...prev,
      [utilityName]: true,
    }));
  };

  const closeUtility = (utilityName: keyof ActiveUtilities) => {
    setActiveUtilities((prev) => ({
      ...prev,
      [utilityName]: false,
    }));
  };

  const toggleUtility = (utilityName: keyof ActiveUtilities) => {
    setActiveUtilities((prev) => ({
      ...prev,
      [utilityName]: !prev[utilityName],
    }));
  };

  const closeAll = () => {
    setActiveUtilities({
      coinFlipper: false,
      randomGen: false,
      randomGamePicker: false,
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
    openCoinFlipper: () => openUtility("coinFlipper"),
    closeCoinFlipper: () => closeUtility("coinFlipper"),
    openRandomGen: () => openUtility("randomGen"),
    closeRandomGen: () => closeUtility("randomGen"),
    openMagic8Ball: () => openUtility("magic8Ball"),
    closeMagic8Ball: () => closeUtility("magic8Ball"),
    openWinLinks: () => openUtility("winLinks"),
    closeWinLinks: () => closeUtility("winLinks"),
  };

  // Expose API globally for potential hotkeys/external triggers
  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).__stake_utilitiesApi = value;
  }, [value]);

  return h(UtilitiesContext.Provider, { value }, children);
}

/**
 * Hook to access utilities management functions
 */
export function useUtilities(): UtilitiesContextValue {
  const context = useContext(UtilitiesContext);
  if (!context) {
    throw new Error("useUtilities must be used within UtilitiesProvider");
  }
  return context;
}
