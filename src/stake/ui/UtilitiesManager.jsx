/**
 * Utilities Manager
 * Central manager for rendering all active utility windows
 * Similar to keno's ModalsManager pattern
 */

import { h } from 'preact';
import { useUtilities } from '../hooks/useUtilities.js';
import { CoinFlipper } from './CoinFlipper.jsx';

/**
 * Manages rendering of all utility windows
 */
export function UtilitiesManager() {
  const { activeUtilities, closeUtility } = useUtilities();

  return (
    <>
      {/* Coin Flipper */}
      {activeUtilities.coinFlipper && (
        <CoinFlipper onClose={() => closeUtility('coinFlipper')} />
      )}

      {/* Random Number Generator - Coming soon */}
      {activeUtilities.randomGen && (
        <div>Random Gen Coming Soon</div>
      )}

      {/* Magic 8-Ball - Coming soon */}
      {activeUtilities.magic8Ball && (
        <div>Magic 8-Ball Coming Soon</div>
      )}

      {/* Win Links - Coming soon */}
      {activeUtilities.winLinks && (
        <div>Win Links Coming Soon</div>
      )}
    </>
  );
}
