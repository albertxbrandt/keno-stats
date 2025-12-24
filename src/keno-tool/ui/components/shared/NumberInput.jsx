// src/ui/components/shared/NumberInput.jsx
// Reusable number input with validation and constraints
// Ensures values stay within min/max bounds

/**
 * NumberInput Component
 * 
 * A styled number input that enforces min/max constraints and provides validation.
 * Automatically clamps values to the allowed range on blur.
 * 
 * @component
 * @param {Object} props
 * @param {number} props.value - Current input value
 * @param {Function} props.onChange - Callback fired when value changes (receives clamped number)
 * @param {number} [props.min=1] - Minimum allowed value
 * @param {number} [props.max=100] - Maximum allowed value
 * @param {number} [props.step=1] - Step increment for arrow buttons
 * @param {string} [props.width='100%'] - CSS width of the input
 * @param {string} [props.placeholder] - Placeholder text
 * @param {boolean} [props.disabled=false] - Whether input is disabled
 * @param {number} [props.opacity=1] - Opacity (useful for disabled state)
 * 
 * @example
 * <NumberInput 
 *   value={count}
 *   onChange={setCount}
 *   min={1}
 *   max={10}
 *   width="64px"
 * />
 */
export function NumberInput({
  value,
  onChange,
  min = 1,
  max = 100,
  step = 1,
  width = '100%',
  placeholder,
  disabled = false,
  opacity = 1
}) {
  const handleChange = (e) => {
    const rawValue = e.target.value;
    
    // Allow empty input while typing
    if (rawValue === '') {
      onChange(min); // Default to min when empty
      return;
    }

    // Parse and clamp value
    let numValue = parseFloat(rawValue);
    
    // Handle invalid numbers
    if (isNaN(numValue)) {
      numValue = min;
    }

    // Clamp to min/max
    numValue = Math.max(min, Math.min(max, numValue));
    
    onChange(numValue);
  };

  return (
    <input 
      type="number"
      value={value}
      onChange={handleChange}
      min={min}
      max={max}
      step={step}
      placeholder={placeholder}
      disabled={disabled}
      style={{
        width,
        background: '#14202b',
        border: '1px solid #444',
        color: '#fff',
        padding: '4px',
        borderRadius: '4px',
        textAlign: 'center',
        fontSize: '11px',
        opacity: opacity.toString()
      }}
    />
  );
}
