// src/ui/components/shared/ToggleSwitch.jsx
// Reusable toggle switch component with animated dot and track
// Used throughout the overlay for on/off settings

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
 * @param {string} [props.activeColor='#74b9ff'] - Color when toggle is ON
 * @param {string} [props.inactiveColor='white'] - Color when toggle is OFF
 * @param {string} [props.trackActiveColor='#2a3b4a'] - Track background when ON
 * @param {string} [props.trackInactiveColor='#444'] - Track background when OFF
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
  activeColor = '#74b9ff',
  inactiveColor = 'white',
  trackActiveColor = '#2a3b4a',
  trackInactiveColor = '#444'
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
