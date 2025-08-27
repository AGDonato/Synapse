// src/components/ui/Button.tsx
import React from 'react';

export interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
  variant?:
    | 'primary'
    | 'secondary'
    | 'outline'
    | 'ghost'
    | 'success'
    | 'warning'
    | 'error';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  fullWidth?: boolean;
  loading?: boolean;
  className?: string;
}

export default function Button({
  children,
  onClick,
  type = 'button',
  variant = 'primary',
  size = 'md',
  disabled = false,
  fullWidth = false,
  loading = false,
  className = '',
}: ButtonProps) {
  const isDisabled = disabled || loading;
  const [isHovered, setIsHovered] = React.useState(false);
  const [isFocused, setIsFocused] = React.useState(false);

  // CSS class-based approach using design tokens
  const baseClasses = [
    'inline-flex',
    'items-center',
    'justify-center',
    'font-medium',
    'rounded-md',
    'transition-all',
    'duration-200',
    'focus:outline-none',
    'focus:ring-2',
    'focus:ring-offset-2',
    'focus:ring-blue-500',
    'disabled:cursor-not-allowed',
    'disabled:opacity-50',
  ];

  const sizeClasses = {
    sm: ['text-sm', 'px-3', 'py-1.5', 'gap-1.5'],
    md: ['text-sm', 'px-4', 'py-2', 'gap-2'],
    lg: ['text-base', 'px-6', 'py-3', 'gap-2'],
  };

  const variantClasses = {
    primary: [
      'bg-blue-600',
      'text-white',
      'hover:bg-blue-700',
      'active:bg-blue-800',
      'shadow-sm',
    ],
    secondary: [
      'bg-gray-100',
      'text-gray-900',
      'hover:bg-gray-200',
      'active:bg-gray-300',
      'border',
      'border-gray-300',
    ],
    outline: [
      'bg-transparent',
      'text-gray-700',
      'border',
      'border-gray-300',
      'hover:bg-gray-50',
      'active:bg-gray-100',
    ],
    ghost: [
      'bg-transparent',
      'text-gray-700',
      'hover:bg-gray-100',
      'active:bg-gray-200',
    ],
    success: [
      'bg-green-600',
      'text-white',
      'hover:bg-green-700',
      'active:bg-green-800',
      'shadow-sm',
    ],
    warning: [
      'bg-yellow-600',
      'text-white',
      'hover:bg-yellow-700',
      'active:bg-yellow-800',
      'shadow-sm',
    ],
    error: [
      'bg-red-600',
      'text-white',
      'hover:bg-red-700',
      'active:bg-red-800',
      'shadow-sm',
    ],
  };

  const fullWidthClasses = fullWidth ? ['w-full'] : [];

  const allClasses = [
    ...baseClasses,
    ...sizeClasses[size],
    ...variantClasses[variant],
    ...fullWidthClasses,
    className,
  ].join(' ');

  // Simple inline styles using CSS custom properties directly
  const style: React.CSSProperties = {
    border: 'none',
    borderRadius: 'var(--radius-md)',
    fontWeight: 'var(--font-weight-medium)',
    cursor: isDisabled ? 'not-allowed' : 'pointer',
    transition: 'all 0.2s ease',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 'var(--space-2)',
    width: fullWidth ? '100%' : 'auto',
    opacity: isDisabled ? '0.5' : '1',
    transform: isHovered && !isDisabled ? 'translateY(-1px)' : 'translateY(0)',
    // Focus outline - adapta cor baseada na variante
    outline:
      isFocused && !isDisabled
        ? variant === 'secondary'
          ? '2px solid var(--color-error-500, #dc2626)'
          : variant === 'error'
            ? '2px solid var(--color-error-600, #dc2626)'
            : '2px solid var(--border-focus)'
        : 'none',
    outlineOffset: isFocused && !isDisabled ? '2px' : '0',

    // Size variants
    ...(size === 'sm' && {
      padding: 'var(--space-2) var(--space-3)',
      fontSize: 'var(--font-size-sm)',
    }),
    ...(size === 'md' && {
      padding: 'var(--space-2) var(--space-4)',
      fontSize: 'var(--font-size-sm)',
    }),
    ...(size === 'lg' && {
      padding: 'var(--space-3) var(--space-6)',
      fontSize: 'var(--font-size-base)',
    }),

    // Variant styles
    ...(variant === 'primary' && {
      backgroundColor:
        isHovered && !isDisabled
          ? 'var(--interactive-primary-hover)'
          : 'var(--interactive-primary)',
      color: 'var(--text-on-brand)',
    }),
    ...(variant === 'secondary' && {
      backgroundColor:
        isHovered && !isDisabled
          ? 'var(--interactive-secondary-hover, #e5e7eb)'
          : 'var(--interactive-secondary)',
      color: 'var(--text-primary)',
      border: '1px solid var(--border-primary)',
    }),
    ...(variant === 'outline' && {
      backgroundColor:
        isHovered && !isDisabled
          ? 'var(--background-secondary, #f9fafb)'
          : 'transparent',
      color: 'var(--text-primary)',
      border: '1px solid var(--border-primary)',
    }),
    ...(variant === 'ghost' && {
      backgroundColor:
        isHovered && !isDisabled
          ? 'var(--background-secondary, #f3f4f6)'
          : 'transparent',
      color: 'var(--text-primary)',
    }),
    ...(variant === 'success' && {
      backgroundColor:
        isHovered && !isDisabled
          ? 'var(--color-success-600, #059669)'
          : 'var(--color-success-500)',
      color: 'var(--text-on-brand)',
    }),
    ...(variant === 'warning' && {
      backgroundColor:
        isHovered && !isDisabled
          ? 'var(--color-warning-600, #d97706)'
          : 'var(--color-warning-500)',
      color: 'var(--text-on-brand)',
    }),
    ...(variant === 'error' && {
      backgroundColor:
        isHovered && !isDisabled
          ? 'var(--color-error-600, #dc2626)'
          : 'var(--color-error-500)',
      color: 'var(--text-on-brand)',
    }),
  };

  return (
    <button
      type={type}
      onClick={isDisabled ? undefined : onClick}
      style={style}
      disabled={isDisabled}
      className={allClasses}
      aria-busy={loading}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onFocus={() => setIsFocused(true)}
      onBlur={() => setIsFocused(false)}
    >
      {loading && (
        <svg
          className="animate-spin h-4 w-4"
          style={{ width: '1rem', height: '1rem' }}
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
            opacity="0.25"
          />
          <path
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      )}
      {children}
    </button>
  );
}
