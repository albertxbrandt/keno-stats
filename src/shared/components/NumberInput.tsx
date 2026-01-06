// src/ui/components/shared/NumberInput.tsx
// Reusable number input with validation and constraints
// Ensures values stay within min/max bounds

interface NumberInputProps {
  /** Current input value */
  value: number;
  /** Callback fired when value changes (receives clamped number) */
  onChange: (value: number) => void;
  /** Minimum allowed value */
  min?: number;
  /** Maximum allowed value */
  max?: number;
  /** Step increment for arrow buttons */
  step?: number;
  /** CSS width of the input */
  width?: string;
  /** Placeholder text */
  placeholder?: string;
  /** Whether input is disabled */
  disabled?: boolean;
  /** Opacity (useful for disabled state) */
  opacity?: number;
}

/**
 * NumberInput Component
 *
 * A styled number input that enforces min/max constraints and provides validation.
 * Automatically clamps values to the allowed range on blur.
 *
 * @component
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
  width = "100%",
  placeholder,
  disabled = false,
  opacity = 1,
}: NumberInputProps) {
  const handleChange = (e: Event) => {
    const target = e.target as HTMLInputElement;
    const rawValue = target.value;

    // Allow empty input while typing
    if (rawValue === "") {
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
        background: "#14202b",
        border: "1px solid #444",
        color: "#fff",
        padding: "4px",
        borderRadius: "4px",
        textAlign: "center",
        fontSize: "11px",
        opacity: opacity.toString(),
      }}
    />
  );
}
