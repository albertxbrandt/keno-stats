// src/shared/components/Button.jsx
// Reusable button component with consistent styling across the app

import { COLORS } from '@/shared/constants/colors.js';
import { BORDER_RADIUS } from '@/shared/constants/styles.js';

/**
 * Button Component
 * 
 * Consistent button styling with multiple variants and sizes
 * 
 * @component
 * @param {Object} props
 * @param {string} props.variant - Button style: 'primary', 'secondary', 'success', 'warning', 'danger', 'ghost'
 * @param {string} props.size - Button size: 'sm', 'md', 'lg'
 * @param {boolean} props.fullWidth - Whether button takes full width
 * @param {boolean} props.disabled - Whether button is disabled
 * @param {Function} props.onClick - Click handler
 * @param {preact.VNode} props.icon - Optional icon element
 * @param {string} props.iconPosition - Icon position: 'left' or 'right'
 * @param {preact.ComponentChildren} props.children - Button content
 * @param {Object} props.style - Additional inline styles
 * 
 * @example
 * <Button variant="primary" size="md" onClick={handleClick}>
 *   Click Me
 * </Button>
 * 
 * <Button variant="success" icon={<CheckIcon />} iconPosition="left">
 *   Confirm
 * </Button>
 */
export function Button({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  disabled = false,
  onClick,
  icon,
  iconPosition = 'left',
  children,
  style = {},
  ...props
}) {
  // Size configurations
  const sizes = {
    sm: {
      padding: '6px 12px',
      fontSize: '11px',
      iconSize: 14,
      gap: '6px'
    },
    md: {
      padding: '8px 16px',
      fontSize: '13px',
      iconSize: 16,
      gap: '8px'
    },
    lg: {
      padding: '10px 20px',
      fontSize: '14px',
      iconSize: 18,
      gap: '10px'
    }
  };

  // Variant configurations
  const variants = {
    primary: {
      background: COLORS.accent.info,
      color: '#fff',
      border: 'none',
      hoverBackground: '#5a9fd8'
    },
    secondary: {
      background: 'transparent',
      color: COLORS.accent.info,
      border: `1px solid ${COLORS.accent.info}`,
      hoverBackground: 'rgba(116, 185, 255, 0.1)'
    },
    success: {
      background: COLORS.accent.success,
      color: '#fff',
      border: 'none',
      hoverBackground: '#1ea773'
    },
    warning: {
      background: COLORS.accent.warning,
      color: '#000',
      border: 'none',
      hoverBackground: '#e6b800'
    },
    danger: {
      background: COLORS.accent.error,
      color: '#fff',
      border: 'none',
      hoverBackground: '#d84444'
    },
    ghost: {
      background: 'transparent',
      color: COLORS.text.primary,
      border: `1px solid ${COLORS.border.light}`,
      hoverBackground: COLORS.bg.darker
    }
  };

  const sizeConfig = sizes[size];
  const variantConfig = variants[variant];

  const buttonStyle = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: sizeConfig.gap,
    padding: sizeConfig.padding,
    fontSize: sizeConfig.fontSize,
    fontWeight: '600',
    fontFamily: 'inherit',
    background: variantConfig.background,
    color: variantConfig.color,
    border: variantConfig.border,
    borderRadius: BORDER_RADIUS.sm,
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.5 : 1,
    transition: 'all 0.2s ease',
    width: fullWidth ? '100%' : 'auto',
    outline: 'none',
    ...style
  };

  const handleMouseEnter = (e) => {
    if (!disabled) {
      e.currentTarget.style.background = variantConfig.hoverBackground;
      if (variant === 'secondary' || variant === 'ghost') {
        e.currentTarget.style.borderColor = COLORS.accent.info;
      }
    }
  };

  const handleMouseLeave = (e) => {
    if (!disabled) {
      e.currentTarget.style.background = variantConfig.background;
      if (variant === 'secondary') {
        e.currentTarget.style.borderColor = COLORS.accent.info;
      } else if (variant === 'ghost') {
        e.currentTarget.style.borderColor = COLORS.border.light;
      }
    }
  };

  const handleClick = (e) => {
    if (!disabled && onClick) {
      onClick(e);
    }
  };

  return (
    <button
      style={buttonStyle}
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      disabled={disabled}
      {...props}
    >
      {icon && iconPosition === 'left' && (
        <span style={{ display: 'flex', alignItems: 'center' }}>{icon}</span>
      )}
      {children && <span>{children}</span>}
      {icon && iconPosition === 'right' && (
        <span style={{ display: 'flex', alignItems: 'center' }}>{icon}</span>
      )}
    </button>
  );
}
