// src/shared/components/Button.tsx
// Reusable button component with consistent styling across the app

import { ComponentChildren, VNode, JSX, FunctionComponent } from "preact";
import { COLORS } from "@/shared/constants/colors.js";
import { BORDER_RADIUS } from "@/shared/constants/styles.js";

interface ButtonProps {
  variant?:
    | "primary"
    | "secondary"
    | "success"
    | "warning"
    | "danger"
    | "ghost";
  size?: "sm" | "md" | "lg";
  fullWidth?: boolean;
  disabled?: boolean;
  onClick?: () => void | Promise<void>;
  icon?: VNode;
  iconPosition?: "left" | "right";
  children?: ComponentChildren;
  style?: JSX.CSSProperties;
}

interface SizeConfig {
  padding: string;
  fontSize: string;
  iconSize: number;
  gap: string;
}

interface VariantConfig {
  background: string;
  color: string;
  border: string;
  hoverBackground: string;
}

/**
 * Button Component
 *
 * Consistent button styling with multiple variants and sizes
 *
 * @component
 * @param {ButtonProps} props
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
export const Button: FunctionComponent<ButtonProps> = ({
  variant = "primary",
  size = "md",
  fullWidth = false,
  disabled = false,
  onClick,
  icon,
  iconPosition = "left",
  children,
  style = {},
  ...props
}) => {
  // Size configurations
  const sizes: Record<string, SizeConfig> = {
    sm: {
      padding: "6px 12px",
      fontSize: "11px",
      iconSize: 14,
      gap: "6px",
    },
    md: {
      padding: "8px 16px",
      fontSize: "13px",
      iconSize: 16,
      gap: "8px",
    },
    lg: {
      padding: "10px 20px",
      fontSize: "14px",
      iconSize: 18,
      gap: "10px",
    },
  };

  // Variant configurations
  const variants: Record<string, VariantConfig> = {
    primary: {
      background: COLORS.accent.info,
      color: "#fff",
      border: "none",
      hoverBackground: "#5a9fd8",
    },
    secondary: {
      background: "transparent",
      color: COLORS.accent.info,
      border: `1px solid ${COLORS.accent.info}`,
      hoverBackground: "rgba(116, 185, 255, 0.1)",
    },
    success: {
      background: COLORS.accent.success,
      color: "#fff",
      border: "none",
      hoverBackground: "#00a07a",
    },
    warning: {
      background: COLORS.accent.warning,
      color: "#000",
      border: "none",
      hoverBackground: "#e6c200",
    },
    danger: {
      background: COLORS.accent.error,
      color: "#fff",
      border: "none",
      hoverBackground: "#e55d5d",
    },
    ghost: {
      background: "transparent",
      color: COLORS.text.secondary,
      border: `1px solid ${COLORS.border.default}`,
      hoverBackground: COLORS.bg.darkest,
    },
  };

  const sizeConfig = sizes[size]!;
  const variantConfig = variants[variant]!;

  const buttonStyle: JSX.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: icon ? sizeConfig.gap : "0",
    padding: sizeConfig.padding,
    fontSize: sizeConfig.fontSize,
    fontWeight: "600",
    fontFamily: "inherit",
    background: variantConfig.background,
    color: variantConfig.color,
    border: variantConfig.border,
    borderRadius: BORDER_RADIUS.md,
    cursor: disabled ? "not-allowed" : "pointer",
    opacity: disabled ? 0.5 : 1,
    transition: "all 0.2s ease",
    userSelect: "none",
    width: fullWidth ? "100%" : "auto",
    ...style,
  };

  const handleClick = (_e: MouseEvent) => {
    if (!disabled && onClick) {
      onClick();
    }
  };

  const handleMouseEnter = (e: MouseEvent) => {
    if (!disabled) {
      const target = e.currentTarget as HTMLButtonElement;
      target.style.background = variantConfig.hoverBackground;
      if (variant === "ghost") {
        target.style.color = COLORS.text.primary;
      }
    }
  };

  const handleMouseLeave = (e: MouseEvent) => {
    if (!disabled) {
      const target = e.currentTarget as HTMLButtonElement;
      target.style.background = variantConfig.background;
      target.style.color = variantConfig.color;
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
      {icon && iconPosition === "left" && icon}
      {children}
      {icon && iconPosition === "right" && icon}
    </button>
  );
};
