// src/components/ui/Button.tsx
import React, { useState, useMemo, useCallback } from 'react';
import { theme } from '../../styles/theme';

export type ButtonProps = {
  children: React.ReactNode;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
  variant?: 'primary' | 'danger' | 'secondary';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  fullWidth?: boolean;
};

const Button = React.memo<ButtonProps>(function Button({
  children,
  onClick,
  type = 'button',
  variant = 'primary',
  size = 'md',
  disabled = false,
  fullWidth = false,
}: ButtonProps) {
  const [isHovered, setIsHovered] = useState(false);

  // Memoized base styles
  const baseStyle = useMemo((): React.CSSProperties => ({
    color: 'white',
    border: 'none',
    borderRadius: theme.borderRadius.md,
    fontWeight: theme.fontWeight.semibold,
    cursor: disabled ? 'not-allowed' : 'pointer',
    fontSize: theme.fontSize.sm,
    transition: theme.transitions.fast,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    outline: 'none',
    width: fullWidth ? '100%' : 'auto',
  }), [disabled, fullWidth]);

  // Memoized size styles
  const sizeStyles = useMemo((): Record<'sm' | 'md' | 'lg', React.CSSProperties> => ({
    sm: {
      padding: `${theme.spacing.xs} ${theme.spacing.md}`,
      fontSize: theme.fontSize.xs,
    },
    md: {
      padding: `${theme.spacing.sm} ${theme.spacing.lg}`,
      fontSize: theme.fontSize.sm,
    },
    lg: {
      padding: `${theme.spacing.md} ${theme.spacing.xl}`,
      fontSize: theme.fontSize.base,
    },
  }), []);

  // Memoized variant styles
  const variantStyles = useMemo((): React.CSSProperties => {
    if (disabled) {
      return {
        backgroundColor: theme.colors.gray[300],
        color: theme.colors.gray[500],
      };
    }

    const variantConfig = {
      primary: {
        background: theme.colors.primary,
        hover: theme.colors.primaryHover,
        color: 'white',
      },
      danger: {
        background: theme.colors.danger,
        hover: theme.colors.dangerHover,
        color: 'white',
      },
      secondary: {
        background: theme.colors.gray[100],
        hover: theme.colors.gray[200],
        color: theme.colors.gray[700],
      },
    };

    const config = variantConfig[variant];

    return {
      backgroundColor: isHovered ? config.hover : config.background,
      color: config.color,
    };
  }, [variant, disabled, isHovered]);

  // Memoized combined styles
  const combinedStyle = useMemo((): React.CSSProperties => ({
    ...baseStyle,
    ...sizeStyles[size],
    ...variantStyles,
  }), [baseStyle, sizeStyles, size, variantStyles]);

  // Memoized hover handlers
  const handleMouseEnter = useCallback(() => setIsHovered(true), []);
  const handleMouseLeave = useCallback(() => setIsHovered(false), []);

  return (
    <button
      type={type}
      onClick={onClick}
      style={combinedStyle}
      disabled={disabled}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {children}
    </button>
  );
});

export default Button;
