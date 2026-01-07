/**
 * Utilities Manager
 * Central manager for rendering all active utility windows
 * Similar to keno's ModalsManager pattern
 */

import { h } from 'preact';
import { useUtilities } from '../hooks/useUtilities';
import { CoinFlipper } from './CoinFlipper.jsx';
import { RandomNumberGen } from './RandomNumberGen.jsx';
import { RandomGamePicker } from './RandomGamePicker.jsx';
import { Magic8Ball } from './Magic8Ball.jsx';
import { AddWinLink } from './AddWinLink.tsx';

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

      {/* Random Number Generator */}
      {activeUtilities.randomGen && (
        <RandomNumberGen onClose={() => closeUtility('randomGen')} />
      )}

      {/* Random Game Picker */}
      {activeUtilities.randomGamePicker && (
        <RandomGamePicker onClose={() => closeUtility('randomGamePicker')} />
      )}

      {/* Magic 8-Ball */}
      {activeUtilities.magic8Ball && (
        <Magic8Ball onClose={() => closeUtility('magic8Ball')} />
      )}

      {/* Add Win Link */}
      {activeUtilities.winLinks && (
        <AddWinLink onClose={() => closeUtility('winLinks')} />
      )}
    </>
  );
}
