// src/components/ui/Button.tsx
import React from 'react';
import { clsx } from 'clsx';
import styles from './Button.module.css';

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
    | 'error'
    | 'danger';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  fullWidth?: boolean;
  loading?: boolean;
  className?: string;
}

const LoadingSpinner = () => (
  <svg className={styles.spinner} fill='none' viewBox='0 0 24 24'>
    <circle cx='12' cy='12' r='10' stroke='currentColor' strokeWidth='4' opacity='0.25' />
    <path
      fill='currentColor'
      d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'
    />
  </svg>
);

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

  const buttonClasses = clsx(
    styles.button,
    styles[variant],
    styles[size],
    {
      [styles.fullWidth]: fullWidth,
    },
    className
  );

  return (
    <button
      type={type}
      onClick={isDisabled ? undefined : onClick}
      disabled={isDisabled}
      className={buttonClasses}
      aria-busy={loading}
    >
      {loading && <LoadingSpinner />}
      {children}
    </button>
  );
}
