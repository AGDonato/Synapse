// src/components/ui/Input.tsx
import React from 'react';
import { theme } from '../../styles/theme';

export type InputProps = {
  type?: 'text' | 'email' | 'password' | 'number' | 'search';
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  error?: string;
  label?: string;
  width?: string;
};

const inputStyles: React.CSSProperties = {
  width: '100%',
  padding: `${theme.spacing.sm} ${theme.spacing.md}`,
  border: `1px solid ${theme.colors.border}`,
  borderRadius: theme.borderRadius.md,
  fontSize: theme.fontSize.sm,
  color: theme.colors.text.primary,
  backgroundColor: theme.colors.background.primary,
  transition: theme.transitions.fast,
  outline: 'none',
};

const inputHoverStyles: React.CSSProperties = {
  borderColor: '#007bff',
};

const inputFocusStyles: React.CSSProperties = {
  borderColor: '#007bff',
  boxShadow: '0 0 0 2px rgba(0, 123, 255, 0.25)',
};

const inputErrorStyles: React.CSSProperties = {
  borderColor: theme.colors.danger,
};

const inputDisabledStyles: React.CSSProperties = {
  backgroundColor: theme.colors.background.muted,
  color: theme.colors.text.muted,
  cursor: 'not-allowed',
};

const labelStyles: React.CSSProperties = {
  display: 'block',
  marginBottom: theme.spacing.xs,
  fontSize: theme.fontSize.sm,
  fontWeight: theme.fontWeight.medium,
  color: theme.colors.text.primary,
};

const errorStyles: React.CSSProperties = {
  marginTop: theme.spacing.xs,
  fontSize: theme.fontSize.xs,
  color: theme.colors.danger,
};

const containerStyles: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
};

export default function Input({
  type = 'text',
  value,
  onChange,
  placeholder,
  required = false,
  disabled = false,
  error,
  label,
  width = '100%',
}: InputProps) {
  const [isFocused, setIsFocused] = React.useState(false);
  const [isHovered, setIsHovered] = React.useState(false);

  const getInputStyles = (): React.CSSProperties => {
    let styles = { ...inputStyles };

    if (isHovered && !disabled && !error && !isFocused) {
      styles = { ...styles, ...inputHoverStyles };
    }

    if (isFocused && !disabled && !error) {
      styles = { ...styles, ...inputFocusStyles };
    }

    if (error) {
      styles = { ...styles, ...inputErrorStyles };
    }

    if (disabled) {
      styles = { ...styles, ...inputDisabledStyles };
    }

    return styles;
  };

  return (
    <div style={{ ...containerStyles, width }}>
      {label && (
        <label style={labelStyles}>
          {label}
          {required && <span style={{ color: theme.colors.danger }}> *</span>}
        </label>
      )}
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        style={getInputStyles()}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      />
      {error && <span style={errorStyles}>{error}</span>}
    </div>
  );
}
