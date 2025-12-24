// src/ui/components/shared/ToggleSwitch.jsx
// Reusable toggle switch component with animated dot and track
// Used throughout the overlay for on/off settings

import { COLORS } from '@/shared/constants/colors.js';

/**
 * ToggleSwitch Component
 * 
 * A styled toggle switch with animated transitions for the dot and track background.
 * Follows the design pattern used in the original overlay (switch with sliding dot).
 * 
 * @component
 * @param {Object} props
 * @param {boolean} props.checked - Current toggle state (on/off)
 * @param {Function} props.onChange - Callback fired when toggle is clicked
 * @param {string} [props.dotId] - Optional ID for the dot element (for external references)
 * @param {string} [props.activeColor] - Color when toggle is ON (defaults to COLORS.accent.info)
 * @param {string} [props.inactiveColor] - Color when toggle is OFF (defaults to COLORS.text.primary)
 * @param {string} [props.trackActiveColor] - Track background when ON (defaults to COLORS.bg.darker)
 * @param {string} [props.trackInactiveColor] - Track background when OFF (defaults to COLORS.border.default)
 * 
 * @example
 * <ToggleSwitch 
 *   checked={isEnabled} 
 *   onChange={(e) => setIsEnabled(e.target.checked)}
 *   activeColor="#ffd700"
 * />
 */
export function ToggleSwitch({
  checked,
  onChange,
  dotId,
  activeColor = COLORS.accent.info,
  inactiveColor = COLORS.text.primary,
  trackActiveColor = COLORS.bg.darker,
  trackInactiveColor = COLORS.border.default
}) {
  const dotTransform = checked ? 'translateX(14px)' : 'translateX(0px)';
  const dotColor = checked ? activeColor : inactiveColor;
  const trackColor = checked ? trackActiveColor : trackInactiveColor;

  return (
    <label class="switch" style={{
      position: 'relative',
      display: 'inline-block',
      width: '34px',
      height: '20px'
    }}>
      <input 
        type="checkbox" 
        checked={checked}
        onChange={onChange}
        style={{ opacity: 0, width: 0, height: 0 }}
      />
      <span style={{
        position: 'absolute',
        cursor: 'pointer',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: trackColor,
        transition: '.4s',
        borderRadius: '20px'
      }}></span>
      <span 
        id={dotId}
        style={{
          position: 'absolute',
          height: '14px',
          width: '14px',
          left: '3px',
          bottom: '3px',
          backgroundColor: dotColor,
          transition: '.4s',
          borderRadius: '50%',
          cursor: 'pointer',
          transform: dotTransform
        }}
      ></span>
    </label>
  );
}
